const fs = require("fs");
const Coldbrew = require('./runtime');
const Game = require('./game');
const Compiler = require('./compiler');
const path = require('path');

var argv = require('yargs')
    .usage('Usage: $0 <command> [options]')
    .command('run', 'Run a battlecode game.')
    .example('$0 run -r red_dir -b blue_dir', 'Run a game between bots in the red_dir and blue_dir directories.')
    .alias('r', 'red_dir')
    .describe('r', 'Load the red source directory')
    .alias('b', 'blue_dir')
    .describe('b', 'Load the blue source directory')
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
    .default('chi', 100)
    .describe('chi', 'Initial time, in ms.')
    .alias('che', 'chess_extra')
    .default('che', 20)
    .describe('che', 'Extra time per turn, in ms.')
    .demandOption(['r','b'])
    .help('h')
    .alias('h', 'help')
    .argv;

const CHESS_INITIAL = argv.chi;
const CHESS_EXTRA = argv.che;

const seed = argv.s;

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

const red_dir = getFolder(argv.r);
const blue_dir = getFolder(argv.b);

function writeReplayToFile(replay, filename) {
    var buff = new Uint8Array(replay);
    fs.writeFileSync(filename, Buffer.from(buff));
}

function readReplayFromFile(filename) {
    return fs.readFileSync(filename, null);
}

Compiler.Compile(red_dir, function(compiled_red) {
    Compiler.Compile(blue_dir, function(compiled_blue) {
        let g = new Game(seed, CHESS_INITIAL, CHESS_EXTRA, argv.d, true);
        
        let c = new Coldbrew(g, null, function(logs) {
            writeReplayToFile(g.replay, argv.re);         
        });

        c.playGame(compiled_red, compiled_blue);
    }, function(error) {
        console.log("BLUE COMPILE ERROR");
        console.log(error)
    });
}, function(error) {
    console.log("RED COMPILE ERROR");
    console.log(error);
});