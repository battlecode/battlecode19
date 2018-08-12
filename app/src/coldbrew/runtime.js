import Game from './game';
import Visualizer from './vis'

function inBrowser() {
    return (typeof window !== "undefined");
}

//if (!inBrowser()) var VM = require('vm2');
var VM = require('vm');

// Get some sorta time in millis.
function wallClock() {
    if (typeof window !== 'undefined') return window.performance.now();
    else return new Date().getTime();
}


function CrossVM(code) {
    this.inBrowser = inBrowser();

    if (this.inBrowser) {
        this.context = VM.createContext();
        this.script = VM.createScript(code);
        this.script.runInContext(this.context);
    }

    else {
        this.vm = new VM({ timeout:100, console: 'off' });
        this.vm.run(code);
    }
}

CrossVM.prototype.turn = function(message) {
    var code = "robot.robot._do_turn(" + message + ");"

    if (this.inBrowser) {
        var script = VM.createScript(code);
        return script.runInContext(this.context);
    } else return this.vm.run(code);
}

/**
 * Coldbrew class.
 *
 * Initializes Caja and Pypy and sets up useful callbacks.
 *
 * @param {HTMLElement} canvas - The canvas to render games to.
 * @param {number} [tile_size=30] - The tile size to render games with.
 * @constructor
 */
function Coldbrew(visualizer) {
    this.visualizer = visualizer;
    this.kill = false;
}


/**
 * Start a game.
 *
 * @param {Object} player_one - The red dict. 'code' contains source string, 'lang' either javascript or python.
 * @param {Object} player_two - The blue dict, same format as red.
 * @param {Game} game - The game to play on.
 * @param {function} when_started - The function to call when the game has started.
 * @param {function} when_ended - The function to call when the game has ended.
 */
Coldbrew.prototype.playGame = function(player_one, player_two, log_receiver) {
    this.game = new Game(20,345345,10,false);

    function emptyQueue() {
        while (game.init_queue > 0) {
            let robot = game.initializeRobot();

            let code = (robot.team==0) ? player_one : player_two;

            var start_time = wallClock();
        
            try {
                var v = new CrossVM(code);
            } catch(error) {
                game.robotError("Failed to initialize: " + error,robot);
            }

            if (wallClock() - start_time < 100) {
                game.registerHook(function(turn_json) {
                    return v.turn(turn_json);
                },robot.id);
            } else {
                game.robotError("Took too long to initialize.",robot);
            }
        }
    }

    var round = -1;
    var game = this.game;
    var vis = new Visualizer(this.visualizer, game.shadow[0].length, game.shadow.length, game.viewerMap());
    var gameLoop = setInterval(function() {
        emptyQueue();
        if (game.isOver() || this.kill) {
            clearInterval(gameLoop);
            log_receiver(game.logs);
            vis.gameOver(game.win_condition);
        } else if (!vis.stopped()) {
            if (round == -1) vis.starting();
            game.enactTurn();

            if (game.round != round) {
                vis.feedRound(round, game.viewerMessage());
                vis.setRound(round);
                log_receiver(game.logs);
                round = game.round;
            }
        }
    }.bind(this),0);
}

Coldbrew.prototype.destroy = function() {
    this.kill = true;
}

export default Coldbrew;
