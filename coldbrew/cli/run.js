#!/usr/bin/env node

const fs = require("fs");
const Coldbrew = require('../runtime');
const Game = require('../game');
const SPECS = require('../specs');

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
    .example('$0 -r red_dir -b blue_dir', 'Run a game between bots in the red_dir and blue_dir directories.')
    .example('$0 --rc red_compiled.js -b blue_dir', 'Run a game between the compiled bot red_compiled.js and the blue_dir directory.')
    .example('$0 --rc red_compiled.js --bc blue_compiled.js', 'Run a game between the compiled bots red_compiled.js and blue_compiled.js.')
    .alias('r', 'red_dir')
    .describe('r', 'The red source directory.')
    .alias('b', 'blue_dir')
    .describe('b', 'The blue source directory.')
    .alias('rc', 'red_compiled')
    .describe('rc', 'The red compiled js file.')
    .alias('bc', 'blue_compiled')
    .describe('bc', 'The blue compiled js file.')
    .alias('s', 'seed')
    .default('s', 0)
    .describe('s', 'The mapmaking random (integer) seed.  0 means random.')
    .alias('d', 'debug')
    .default('d', true)
    .describe('d', 'Whether to run in debug mode (prints logs and info in real time).')
    .alias('re', 'replay')
    .default('re', 'replay.bc19')
    .describe('re', 'Name of replay file to save to.')
    .alias('chi', 'chess_initial')
    .default('chi', SPECS.CHESS_INITIAL)
    .describe('chi', 'Initial time, in ms.')
    .alias('che', 'chess_extra')
    .default('che', SPECS.CHESS_EXTRA)
    .describe('che', 'Extra time per turn, in ms.')
    .implies('--no-r', 'rc')
    .implies('r', '--no-rc')
    .implies('--no-b', 'bc')
    .implies('b', '--no-bc')
    .help('h')
    .alias('h', 'help')
    .argv;

const CHESS_INITIAL = argv.chi;
const CHESS_EXTRA = argv.che;

function writeReplayToFile(replay, filename) {
    var buff = new Uint8Array(replay);
    fs.writeFileSync(filename, Buffer.from(buff));
}

function readReplayFromFile(filename) {
    return new Uint8Array(fs.readFileSync(filename, null));
}

var g = null;

process.on('SIGINT', function() {
    if (g) {
        console.log("Exiting nicely, saving replay.");
        writeReplayToFile(g.replay, argv.re);
    } else console.log("Closing.");
    
    process.exit();
});

const seed = argv.s===0 ? Math.floor(Math.random() * Math.pow(2,31)) : argv.s;

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


if (argv.r != null) {
    const red_dir = getFolder(argv.r);
    Compiler.Compile(red_dir, function(compiled_red) {
        if (argv.b != null) {
            const blue_dir = getFolder(argv.b);
            Compiler.Compile(blue_dir, function(compiled_blue) {
                g = new Game(seed, CHESS_INITIAL, CHESS_EXTRA, argv.d, true);

                let c = new Coldbrew(g, null, function(logs) {
                    writeReplayToFile(g.replay, argv.re);         
                });

                c.playGame(compiled_red, compiled_blue);
            }, function(error) {
                console.log("BLUE COMPILE ERROR");
                console.log(error);
            });
        } else {
            var compiled_blue;
            try {
                compiled_blue = fs.readFileSync(argv.bc, null);
            } catch (err) {
                console.log("ERROR LOADING BLUE COMPILED JS");
                console.log(err);
                process.exit();
            }
            g = new Game(seed, CHESS_INITIAL, CHESS_EXTRA, argv.d, true);

            let c = new Coldbrew(g, null, function(logs) {
                writeReplayToFile(g.replay, argv.re);         
            });

            c.playGame(compiled_red, compiled_blue);
        }
    }, function(error) {
        console.log("RED COMPILE ERROR");
        console.log(error);
    });
} else {
    var compiled_red;
    try {
        compiled_red = fs.readFileSync(argv.rc, null);
    } catch (err) {
        console.log("ERROR LOADING RED COMPILED JS");
        console.log(err);
        process.exit();
    }
    if (argv.b != null) {
        const blue_dir = getFolder(argv.b);
        Compiler.Compile(blue_dir, function(compiled_blue) {
            g = new Game(seed, CHESS_INITIAL, CHESS_EXTRA, argv.d, true);

            let c = new Coldbrew(g, null, function(logs) {
                writeReplayToFile(g.replay, argv.re);         
            });

            c.playGame(compiled_red, compiled_blue);
        }, function(error) {
            console.log("BLUE COMPILE ERROR");
            console.log(error);
        });
    } else {
        var compiled_blue;
        try {
            compiled_blue = fs.readFileSync(argv.bc, null);
        } catch (err) {
            console.log("ERROR LOADING BLUE COMPILED JS");
            console.log(err);
            process.exit();
        }
        g = new Game(seed, CHESS_INITIAL, CHESS_EXTRA, argv.d, true);

        let c = new Coldbrew(g, null, function(logs) {
            writeReplayToFile(g.replay, argv.re);         
        });

        c.playGame(compiled_red, compiled_blue);
    }
}

