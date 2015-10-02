# linter-cflint

This linter plugin for [Linter](https://github.com/AtomLinter/Linter) provides
an interface to [CFLint](https://github.com/cflint/CFLint). It will be used with files that have the "ColdFusion" syntax.

## Installation

```
apm install linter-cflint
```

`linter-cflint` currently requires you have the [CFLint](https://github.com/cflint/CFLint) JAR and the Java JRE (or JDK) `java.exe` installed somewhere on your system. Use the configuration to set the location of the JAR and of `java.exe`.

## Settings

You can configure linter-cflint by editing ~/.atom/config.cson (choose Open Your Config in Atom menu) or in Preferences:

```
'linter-eslint':
  'cflintPath': '/Users/foo/cflint/CFLint-0.5.0-all.jar'
  'javaPath': '/usr/java/jdk1.8.0_60/bin/java'
```

* Both paths must be absolute.

## Roadmap
* Add additional rules to [CFLint](https://github.com/cflint/CFLint) (with an emphasis on indentation and formatting rules)
* On-the-fly linting (may require modifications to [CFLint](https://github.com/cflint/CFLint)).
* Performance enhancements.
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
