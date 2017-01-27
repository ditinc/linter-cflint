# linter-cflint :shirt:

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/3e833834a6954be59fba7e2def2d5d8b)](https://www.codacy.com/app/sjmatta/linter-cflint?utm_source=github.com&utm_medium=referral&utm_content=ditinc/linter-cflint&utm_campaign=badger)
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

`linter-cflint` requires Java >= 1.6, JRE or JDK, on your system and either the `JAVA_HOME` environmental variable to be set or for the user to specify the location of the Java executable in the configuration options.

## Configuration
* Similar to `.eslintrc`, you can use a `.cflintrc` file in your project or in a subfolder to exclude rules from the linter. See [the wiki page](https://github.com/ditinc/linter-cflint/wiki/Excluding-rules) for details.

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
