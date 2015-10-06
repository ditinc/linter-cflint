'use babel';
/* globals atom */

import { CompositeDisposable } from 'atom';
import helpers from 'atom-linter';
import { parseString } from './xml2js-promise';
import _ from 'underscore';

if (!atom.config.get('linter-cflint.cflintPath') || !atom.config.get('linter-cflint.javaPath')) {
  atom.notifications.addError('You need to set linter-cflint\'s configuration settings before it will work.', {
    dismissable: true,
  });
}

export default {
  config: {
    cflintPath: {
      type: 'string',
      'default': '',
      description: 'Path to cflint-all.jar (https://github.com/sjmatta/CFLint/releases/download/v0.5-sjm/CFLint-0.5.0-all.jar)',
    },
    javaPath: {
      type: 'string',
      'default': '',
      description: 'Path to Java 7+ executable (JRE or JDK)',
    },
  },

  activate: () => {
    require('atom-package-deps').install('linter-cflint', true);
    this.subscriptions = new CompositeDisposable;
  },

  deactivate: () => {
    return this.subscriptions.dispose();
  },

  provideLinter: () => {
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
      lint: (textEditor) => {
        return new Promise(resolve => {
          const filePath = textEditor.getPath();
          const cflintPath = atom.config.get('linter-cflint.cflintPath');
          const javaPath = atom.config.get('linter-cflint.javaPath');
          const javaArgs = [ '-jar', cflintPath, '-q', '-stdout', '-stdin', '-xml'];
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
            console.log(result);
            const messages =
              _.chain(result.issues.issue)
              .map(issue => {
                const line = parseInt(issue.location[0].$.line, 10);
                return {
                  filePath: filePath,
                  type: issue.$.severity in ['FATAL', 'CRITICAL', 'ERROR'] ? 'Error' : 'Warning',
                  text: issue.location[0].$.message,
                  line: parseInt(issue.location[0].$.line, 10) - 1,
                  range: helpers.rangeFromLineNumber(textEditor, line - 1, issue.location[0].$.column),
                };
              })
              .value();
            resolve(messages);
          });
        });
      },
    };
  },
};
