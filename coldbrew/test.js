const fs = require("fs");
const Coldbrew = require('./runtime');
const Game = require('./game');

const CHESS_INITIAL = 100;
const CHESS_EXTRA = 20;

var seed = Math.floor(10000*Math.random());

function writeReplayToFile(replay, filename) {
    var buff = new Uint8Array(replay);
    fs.writeFileSync(filename, Buffer.from(buff));
}

function readReplayFromFile(filename) {
    return fs.readFileSync(filename, null);
}


var write = false;

if (write) {

    fs.readFile("bot.js", "utf8", function(err, code) {
        fs.readFile("specs.json", "utf8", function(err, specs) {
            code = "var SPECS = " + specs + "\n" + code; 

            let g = new Game(seed, CHESS_INITIAL, CHESS_EXTRA, true, true);
            
            let c = new Coldbrew(g, null, function(logs) {
                writeReplayToFile(g.replay, "replay.bc19");         
            });

            c.playGame(code, code);
        });
    });
 
} else {

    var r = readReplayFromFile("replay.bc19");
    var seed = (r[2] << 8) + r[3];

    g = new Game(seed, CHESS_INITIAL, CHESS_EXTRA, true);

    for (var i=4; i<r.length; i += 8) {
        g.enactTurn(r.slice(i,i+8));
    }

    console.log(g);

}
