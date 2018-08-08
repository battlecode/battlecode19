const Game = require("./game.js");
const Coldbrew = require("./runtime.js");

var fs = require("fs");
var argv = require('yargs')
    .usage('Usage: $0 <command> [options]')
    .command('compute', 'Run a battlecode game.')
    .example('$0 compute -r red.js -b blue.py', 'Run a game between a JS and python bot.')
    .alias('r', 'red_file')
    .describe('r', 'Load the red source file')
    .alias('b', 'blue_file')
    .describe('b', 'Load the blue source file')
    .alias('m', 'map_size')
    .default('m', 20)
    .describe('m', 'The width of the map.')
    .alias('p', 'robots')
    .default('p', 10)
    .describe('p', 'Starting number of robots per team.')
    .alias('d', 'debug')
    .default('d', true)
    .describe('d', 'Whether to run in debug mode.')
    .demandOption(['r','b'])
    .help('h')
    .alias('h', 'help')
    .argv;

let game = new Game(argv.m,argv.p,argv.d);
let coldbrew = new Coldbrew();

red_source = fs.readFileSync(argv.r, "utf8");
blue_source = fs.readFileSync(argv.b, "utf8");

var red = {'code':red_source,'lang':argv.r.endsWith(".js")?"javascript":"python"}
var blue = {'code':blue_source,'lang':argv.b.endsWith(".js")?"javascript":"python"}

coldbrew.onInit(function() {
    coldbrew.playGame(red,blue,game,function() {
        console.log("Starting now...");
    }, function() {
        console.log("Game over!");
    });
});
