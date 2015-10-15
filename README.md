# linter-cflint :shirt:

[![GitHub version](https://badge.fury.io/gh/ditinc%2Flinter-cflint.svg)](http://badge.fury.io/gh/ditinc%2Flinter-cflint)
[![Dependency Status](https://david-dm.org/ditinc/linter-cflint.svg)](https://david-dm.org/ditinc/linter-cflint)
[![devDependency Status](https://david-dm.org/ditinc/linter-cflint/dev-status.svg)](https://david-dm.org/ditinc/linter-cflint#info=devDependencies)

https://atom.io/packages/linter-cflint

This linter plugin for [Linter](https://github.com/AtomLinter/Linter) provides
an interface to [CFLint](https://github.com/cflint/CFLint). It will be used with files that have the "ColdFusion" syntax.

## Installation

```
apm install linter-cflint
```

`linter-cflint` required Java >= 1.6, JRE or JDK, on your system and the `JAVA_HOME` environmental variable to be set.

**If you receive errors about `JAVA_HOME` being unset, you can specify the location of a Java executable instead in the configuration options.**

## Roadmap
* Add additional rules to [CFLint](https://github.com/cflint/CFLint) (with an emphasis on indentation and formatting rules)
* Remove the dependency on Java?
* Better error handling / reporting.

## Contributing

If you would like to contribute enhancements or fixes, please do the following:

0. Fork the plugin repository
0. Hack on a separate topic branch created from the latest `master`
0. Commit and push the topic branch
0. Make a pull request

Please note that modifications should pass the `eslint` linter with the provided `.eslintrc`.

Thank you for helping out!
