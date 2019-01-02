const fs = require("fs");
const Coldstuff = require('./runtime');
const Coldbrew = Coldstuff.Coldbrew;

const CHESS_INITIAL = 100;
const CHESS_EXTRA = 20;

var seed = Math.floor(10000*Math.random());

fs.readFile("bot.js", "utf8", function(err, code) {
	fs.readFile("specs.json", "utf8", function(err, specs) {
		code = "var SPECS = " + specs + "\n" + code; 

		let c = new Coldbrew(null, seed, code, code, CHESS_INITIAL, CHESS_EXTRA, true, function(){});
		c.playGame();
	});
});


