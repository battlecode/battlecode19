var Game = require('./game');
var Visualizer = require('./vis');
var CrossVM = require('./vm');

function wallClock() {
    if (typeof window !== 'undefined') return window.performance.now();
    else return new Date().getTime();
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
function Coldbrew(visualizer, seed, replay_eater) {
    this.visualizer = visualizer;
    this.kill = false;
    this.seed = seed;
    this.replay_eater = replay_eater;
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
    this.game = new Game(20,this.seed,false);

    function emptyQueue() {
        while (game.init_queue > 0) {
            let robot = game.initializeRobot();

            let code = (robot.team==0) ? player_one : player_two;

            var start_time = wallClock();
        
            try {
                var v = new CrossVM(code);
            } catch(error) {
                game.robotError("Failed to initialize: " + error,robot);
                continue;
            }

            if (wallClock() - start_time < 100) {
                game.registerHook(v.turn.bind(v), robot.id);
            } else {
                game.robotError("Took too long to initialize.",robot);
            }
        }
    }

    var round = -1;
    var game = this.game;

    if (this.replay_eater) {
        var replay = {'rounds':[], 'seed':this.seed, 'logs':null, 'width':game.shadow[0].length, 'height':game.shadow.length, 'map': game.viewerMap()};
        replay['rounds'].push(game.viewerMessage());
    } else var vis = new Visualizer(this.visualizer, game.shadow[0].length, game.shadow.length, game.viewerMap());
    
    var gameLoop = setInterval(function() {
        emptyQueue();
        if (game.isOver() || this.kill) {
            clearInterval(gameLoop);
            if (log_receiver) log_receiver(game.logs);
            if (this.replay_eater) {
                replay['logs'] = game.logs;
                replay['win_condition'] = game.win_condition;
                this.replay_eater(replay);
            } else vis.gameOver(game.win_condition);
        } else if (!(!this.replay_eater && vis.stopped())) {
            if (round == -1 && !this.replay_eater) vis.starting();
            game.enactTurn();

            if (game.round != round) {
                if (this.replay_eater) replay['rounds'].push(game.viewerMessage());
                else {
                    vis.feedRound(round, game.viewerMessage());
                    vis.setRound(round);
                }

                if (log_receiver) log_receiver(game.logs);
                round = game.round;
            }
        }
    }.bind(this),0);
}

Coldbrew.prototype.destroy = function() {
    this.kill = true;
}

module.exports = {'Coldbrew': Coldbrew, 'Visualizer': Visualizer};