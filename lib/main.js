'use babel';
/* globals atom */

import { CompositeDisposable } from 'atom'; // eslint-disable-line import/no-unresolved
import { install } from 'atom-package-deps';
import { find, exec, rangeFromLineNumber } from 'atom-linter';
import { parseString } from 'xml2js';
import promisify from 'es6-promisify'; // turns callback APIs into promise APIs
import fs from 'fs';
import json from 'comment-json'; // so .cflintrc can have comments
import findJavaHome from 'find-java-home';
import _ from 'lodash';

export default {
  config: {
    javaPath: {
      type: 'string',
      default: '',
      description: 'Path to the Java 7+ executable (JRE or JDK)',
    },
  },

  activate() {
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.config.observe('linter-cflint.javaPath'), javaPath => {
      this.javaPath = javaPath;
      return javaPath;
    });
    install('linter-cflint');
    atom.config.unset('linter-cflint.cflintPath');
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  provideLinter() {
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
      async lint(textEditor) {
        async function doLint() {
          // find Java home using properties (primary) or findJavaHome (backup)
          let javaPath = this.javaPath;
          if (!javaPath) {
            const javaHome = await promisify(findJavaHome)();
            javaPath = `${javaHome.trim()}/bin/java`;
          }

          // find (optional) .cflintrc
          const filePath = textEditor.getPath().trim();
          const cflintConfig = find(filePath, '.cflintrc');
          let configData = null;
          if (cflintConfig !== null) {
            configData = await promisify(fs.readFile)(cflintConfig);
          }

          // parse .cflintrc
          const configJson = configData !== null ? json.parse(configData, null, true) : {};
          const rules = _(configJson.rules).pickBy(value => value === 0).keys()
            .map(rule => rule.replace(/-/g, '_').toUpperCase())
            .value();

          // execute CFLint.jar with -stdin
          const packagePath = atom.packages.resolvePackagePath('linter-cflint').trim();
          const cflintPath = `${packagePath}/bin/CFLint-0.7.3-all.jar`;
          const javaArgs = [
            '-jar', cflintPath,
            '-q',
            '-e',
            '-stdout',
            '-stdin', textEditor.getFileName(),
            '-xml',
            '-excludeRule', rules,
          ];
          let xmlResult = await exec(javaPath, javaArgs, {
            stdin: textEditor.getText(),
            stdio: 'pipe',
            stream: 'stdout',
            encoding: 'utf8',
            throwOnStdErr: false,
          });

          // sometimes there is junk above the start of the XML
          // this is a common thing in CFLint, and while I try to fix it in
          // less sloppy ways, it is time consuming
          xmlResult = xmlResult.substring(xmlResult.indexOf('<'));
          const result = await promisify(parseString)(xmlResult);
          if (!result || !result.hasOwnProperty('issues')) {
            throw Error('PARSE_ERROR');
          }

          // convert the lint results to Atom Linter format
          // and sort by type, then line
          const messages = _(result.issues.issue).map(issue => {
            const issueLocation = issue.location[0].$;
            const line = parseInt(issueLocation.line, 10);
            const column = issueLocation.column;
            const id = issue.$.id.replace(/_/g, '-').toLowerCase();
            const message = issue.location[0].$.message;
            return {
              filePath,
              type: issue.$.severity === 'ERROR' ? 'Error' : 'Warning',
              html: `<span class="badge badge-flexible">${id}</span> ${message}`,
              line: parseInt(issue.location[0].$.line, 10) - 1,
              range: rangeFromLineNumber(textEditor, line - 1, column),
            };
          }).sortBy(['type', 'line'])
            .value();
          return messages;
        }

        // wrap doLint in a try/catch and handle errors
        try {
          return await doLint();
        } catch (err) {
          console.error(err);
          let message = `An unexpected error occured with linter-cflint. See the
            debug log for details.`;
          if (err.message === 'PARSE_ERROR') {
            message = `[linter-cflint] CFLint encountered an error parsing this
              ColdFusion file.`;
          } else if (err.message === 'write EOF') {
            message = '[linter-cflint] There was a problem running CFLint.jar.';
          }
          atom.notifications.addError(message, { dismissable: true });
        }
        return [];
      },
    };
  },
};
