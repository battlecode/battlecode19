const fs = require("fs");
const Coldbrew = require('./runtime');
const Game = require('./game');
const Compiler = require('./compiler');
const path = require('path');

var argv = require('yargs')
    .usage('Usage: $0 <command> [options]')
    .command('upload', 'Upload a compiled battlecode file.')
    .example('$0 upload -i compiled_bot.js', 'Upload compiled_bot.js.')
    .alias('i', 'input_bot')
    .describe('i', 'The compiled js file of the bot to be uploaded.')
    .demandOption(['i'])
    .help('h')
    .alias('h', 'help')
    .argv;

upload_file(argv.i);
