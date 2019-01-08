#!/usr/bin/env node

const fs = require("fs");
const Coldbrew = require('../runtime');
const Game = require('../game');
const Compiler = require('../compiler');
const path = require('path');
const updateNotifier = require('update-notifier');
const pkg = require('../package.json');

updateNotifier({
    pkg,
    updateCheckInterval:1000*20 // 20 seconds
}).notify();

var argv = require('yargs')
    .usage('Usage: $0 [options]')
    .example('$0 -d bot_dir -o compiled_bot.js', 'Compile the bot in the directory bot_dir to compiled_bot.js.')
    .alias('d', 'bot_dir')
    .describe('d', 'The source directory.')
    .alias('o', 'output_js')
    .describe('o', 'The output file.')
    .default('o', 'compiled_bot.js')
    .alias('f', 'force')
    .describe('f', 'Overwrite the output file if it already exists.')
    .default('f', false)
    .demandOption(['d'])
    .help('h')
    .alias('h', 'help')
    .argv;


function getFolder(dir) {
    code = [];
    
    fs.readdirSync(dir).forEach(file => {
        if (!fs.statSync(path.join(dir,file)).isDirectory() && !file.startsWith('.')) {
            var contents = fs.readFileSync(path.join(dir,file),'utf8');
            code.push({'filename':file, 'source':contents});
        }
    });

    return code;
}

var outputfile = argv.o;

if (outputfile === 'compiled_bot.js') {
    var counter = 1;
    while (fs.existsSync(outputfile)) {
        outputfile = 'compiled_bot' + counter.toString() + '.js'
        counter++;
    }
}

if (!argv.f && fs.existsSync(outputfile)) {
    console.log('Output file ' + outputfile + ' already exists. To overwrite it, use the -f flag.')
    process.exit();
}

const dir = getFolder(argv.d);

function writeToFile(content, filename) {
    var buff = new Uint8Array(content);
    fs.writeFileSync(filename, new Buffer(content));
}

Compiler.Compile(dir, function(compiled_red) {
    writeToFile(compiled_red, outputfile);
}, function(error) {
    console.log("COMPILE ERROR");
    console.log(error);
});
