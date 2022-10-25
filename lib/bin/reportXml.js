#!/usr/bin/env node
const program = require("commander");
const chalk = require("chalk");
const glob = require('glob');

const { APP_PREFIX } = require('../constants');
const XmlReader = require("../xmlReader");

const { version } = require('../../package.json');

console.log(chalk.cyan.bold(` 🤩 Testomat.io XML Reporter v${version}`));

program
  .arguments("<pattern>")
  .option("-d, --dir <dir>", "Project directory")
  .option("--java-tests [java-path]", "Load Java tests from path, by default: src/test/java")
  .option("--lang <lang>", "Language used (python, ruby, java)")
  .option("--env-file <envfile>", "Load environment variables from env file")
  .action(async (pattern, opts) => {
    if (!pattern.endsWith('.xml')) {
      pattern += '.xml';
    }
    let { javaTests, lang } = opts;
    if (opts.envFile) require('dotenv').config(opts.envFile); // eslint-disable-line
    if (javaTests === true) javaTests = 'src/test/java';
    lang = lang?.toLowerCase();
    const runReader = new XmlReader({ javaTests, lang });
    const files = glob.sync(pattern, { cwd: opts.dir || process.cwd() });
    if (!files.length) {
      console.log(APP_PREFIX, `Report can't be created. No XML files found 😥`);
      process.exitCode = 1;
      return;
    }

    for (const file of files) {
      console.log(APP_PREFIX,`Parsed ${file}`);
      runReader.parse(file);
    }
    try {
      await runReader.createRun();
      await runReader.uploadData();
    } catch (err) {
      console.log(APP_PREFIX, 'Error updating status, skipping...', err);
      process.exitCode = 1;
    }
  });

if (process.argv.length < 3) {
  program.outputHelp();
}

program.parse(process.argv);