'use babel';
/* globals atom */

import { CompositeDisposable } from 'atom';

export default {
  config: {
    javaPath: {
      type: 'string',
      'default': '',
      description: 'Path to the Java 7+ executable (JRE or JDK)',
    },
  },

  activate: () => {
    this.subscriptions = new CompositeDisposable;
    this.subscriptions.add(atom.config.observe('linter-cflint.javaPath'),
      (javaPath) => {
        this.javaPath = javaPath;
      });
    require('atom-package-deps').install('linter-cflint', true);
    atom.config.unset('linter-cflint.cflintPath');
  },

  deactivate: () => {
    return this.subscriptions.dispose();
  },

  provideLinter: () => {
    const helpers = require('atom-linter');
    const { parseString } = require('./xml2js-promise');
    return {
      name: 'cflint',
      grammarScopes: [
        'text.html.cfml',
        'source.cfscript.embedded',
        'punctuation.definition.tag.cfml',
        'source.cfscript',
      ],
      scope: 'file',
      lintOnFly: true,
      lint: textEditor => {
        return new Promise(resolve => {
          require('find-java-home')((err, home) => {
            let javaPath = this.javaPath;
            if (!javaPath) {
              if (err) {
                if (!this.errorDisplayed) {
                  atom.notifications.addError('JAVA_HOME is unset or incorrectly setup: ' + err, {
                    dismissable: true,
                  });
                  this.errorDisplayed = true;
                }
                return [];
              }
              javaPath = home.trim() + '/bin/java';
            }
            const filePath = textEditor.getPath().trim();
            const packagePath = atom.packages.resolvePackagePath('linter-cflint').trim();
            const cflintPath = packagePath + '/bin/CFLint-0.5.1-SNAPSHOT-all.jar';
            const javaArgs =
              ['-jar', cflintPath,
              '-q',
              '-e',
              '-stdout',
              '-stdin',
              '-xml',
              '-excludeRule', 'VAR_TOO_SHORT,VAR_TOO_LONG,VAR_INVALID_NAME,ARGUMENT_TOO_SHORT,ARGUMENT_TOO_LONG,VAR_HAS_PREFIX_OR_POSTFIX'];
            helpers.exec(javaPath, javaArgs, {
              stdin: textEditor.getText(),
              stdio: 'pipe',
              encoding: 'utf8',
              throwOnStdErr: false,
            })
            .then(xmlResult => {
              let lintXML = xmlResult;
              if (lintXML.trim()[0] !== '<') {
                lintXML = lintXML.split('\n').slice(1).join('\n');
              }
              return parseString(lintXML);
            })
            .then(result => {
              if (result === undefined || !result.hasOwnProperty('issues')) {
                atom.notifications.addError('CFLint could not parse this document.');
                return;
              }
              const messages =
                result.issues.issue.map(issue => {
                  const line = parseInt(issue.location[0].$.line, 10);
                  return {
                    filePath: filePath,
                    type: issue.$.severity === 'ERROR' ? 'Error' : 'Warning',
                    text: issue.location[0].$.message,
                    line: parseInt(issue.location[0].$.line, 10) - 1,
                    range: helpers.rangeFromLineNumber(textEditor, line - 1, issue.location[0].$.column),
                  };
                })
                .sort((a, b) => {
                  if (a.type === 'Error' && b.type === 'Warning') {
                    return -1;
                  }
                  if (b.type === 'Error' && a.type === 'Warning') {
                    return 1;
                  }
                  if (a.line < b.line) {
                    return -1;
                  }
                  if (b.line < a.line) {
                    return 1;
                  }
                  return 0;
                });
              resolve(messages);
            });
          });
        });
      },
    };
  },
};
