'use babel';
/* globals atom */

import { exec } from 'child-process-promise';
import { CompositeDisposable } from 'atom';
import { parseString } from 'xml2js';
import _ from 'underscore';

const linterPackage = atom.packages.getLoadedPackage('linter');
if (!linterPackage) {
  atom.notifications.addError('Linter should be installed first, `apm install linter`', {
    dismissable: true,
  });
}

export default {
  config: {
    cflintPath: {
      type: 'string',
      'default': '',
      description: 'Path to cflint-all.jar',
    },
    javaPath: {
      type: 'string',
      'default': '',
      description: 'Path to Java 7+ executable (JRE or JDK)',
    },
  },

  activate: () => {
    require('atom-package-deps').install('language-cfml');
    require('atom-package-deps').install('linter-cflint');
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
      lintOnFly: false,
      lint: (textEditor) => {
        return new Promise(resolve => {
          const cflintPath = atom.config.get('linter-cflint.cflintPath');
          const javaPath = atom.config.get('linter-cflint.javaPath');
          const filePath = textEditor.getPath();
          const errorMessage = {type: 'Error', text: 'Something went wrong', range: [[0, 0], [0, 1]], filePath: textEditor.getPath()};
          exec('"' + javaPath + '" -jar "' + cflintPath + '" '
                + '-nooutput -xml ' + '-file "' + filePath + '"',
            {stdio: 'pipe', encoding: 'utf8'})
            .then(xmlResult => {
              let lintXML = xmlResult.stdout;
              if (lintXML.trim()[0] !== '<') {
                lintXML = lintXML.split('\n').slice(1).join('\n');
              }
              parseString(lintXML, (err, result) => {
                if (err) {
                  errorMessage.text = err;
                  resolve([errorMessage]);
                }
                const messages =
                  _.chain(result.issues.issue)
                  .pluck('location')
                  .flatten()
                  .sortBy(location => parseInt(location.$.line, 10))
                  .map(location => {
                    const line = parseInt(location.$.line, 10) - 1;
                    const column = parseInt(location.$.column, 10) - 1;
                    return {
                      type: 'Error', // TODO: get the severity
                      text: location.$.message,
                      filePath: location.$.file,
                      line: line,
                      range: [[line, column], [line, column]], // TODO: Expression has the specifics
                    };
                  })
                  .value();
                resolve(messages);
              });
            }, () => resolve([errorMessage]));
        });
      },
    };
  },
};
