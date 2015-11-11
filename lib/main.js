'use babel';
/* globals atom */

import { CompositeDisposable } from 'atom';
import { parseString } from 'xml2js';
import promisify from 'es6-promisify';
import fs from 'fs';
import json from 'comment-json';
import findJavaHome from 'find-java-home';
import _ from 'lodash';

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
        const filePath = textEditor.getPath().trim();
        let javaPath = this.javaPath;
        return promisify(findJavaHome)().then(javaHome => {
          if (!javaPath) {
            javaPath = javaHome.trim() + '/bin/java';
          }
          const cflintConfig = helpers.findFile(filePath, '.cflintrc');
          if (cflintConfig === null) {
            return null;
          }
          return promisify(fs.readFile)(cflintConfig);
        }, () => {
          return Promise.reject('JAVA_HOME_ERROR');
        })
        .then(configData => {
          const configJson = configData !== null ? json.parse(configData, null, true) : {};
          const rules = _.map(_.invert(configJson.rules, true)[0],
            rule => rule.replace(/-/g, '_').toUpperCase()).toString();
          const packagePath = atom.packages.resolvePackagePath('linter-cflint').trim();
          const cflintPath = packagePath + '/bin/CFLint-0.5.1-SNAPSHOT-all.jar';
          const javaArgs =
            ['-jar', cflintPath,
            '-q',
            '-e',
            '-stdout',
            '-stdin',
            '-xml',
            '-excludeRule', rules];
          return helpers.exec(javaPath, javaArgs, {
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
            return promisify(parseString)(lintXML);
          })
          .then(result => {
            if (!result || !result.hasOwnProperty('issues')) {
              return Promise.reject('PARSE_ERROR');
            }
            const messages =
              _(result.issues.issue).map(issue => {
                const line = parseInt(issue.location[0].$.line, 10);
                const id = issue.$.id.replace(/_/g, '-').toLowerCase();
                const message = issue.location[0].$.message;
                return {
                  filePath: filePath,
                  type: issue.$.severity === 'ERROR' ? 'Error' : 'Warning',
                  html: '<span class="badge badge-flexible">' + id + '</span> ' + message,
                  line: parseInt(issue.location[0].$.line, 10) - 1,
                  range: helpers.rangeFromLineNumber(textEditor, line - 1, issue.location[0].$.column),
                };
              })
              .sortByAll('type', 'line').value();
            return messages;
          });
        })
        .catch(error => {
          let message = '';
          if (error === 'JAVA_HOME_ERROR') {
            if (this.errorDisplayed) {
              return;
            }
            message = 'JAVA_HOME is unset or incorrectly setup.';
            this.errorDisplayed = true;
          } else if (error === 'PARSE_ERROR') {
            message = 'CFLint could not parse this document.';
          } else {
            message = 'An error has occurred: ' + error;
          }
          atom.notifications.addError(message, { dismissable: true });
        });
      },
    };
  },
};
