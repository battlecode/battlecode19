#!/usr/bin/env node

const fs = require("fs");
const Compiler = require('../compiler');
const path = require('path');

var argv = require('yargs')
    .usage('Usage: $0 [options]')
    .example('$0 upload -i compiled_bot.js', 'Upload compiled_bot.js.')
    .alias('i', 'input_bot')
    .describe('i', 'The compiled js file of the bot to be uploaded.')
    .demandOption(['i'])
    .help('h')
    .alias('h', 'help')
    .argv;

upload_file(argv.i);
