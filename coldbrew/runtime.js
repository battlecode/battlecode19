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
function Coldbrew(visualizer, seed, player_one, player_two, chess_init, chess_extra, replay_eater) {
    this.kill = false;
    this.seed = seed;
    this.replay_eater = replay_eater;
    this.player_one = player_one;
    this.player_two = player_two;
    this.chess_init = chess_init;
    this.game = new Game(this.seed, this.chess_init, chess_extra, false);
    
    if (visualizer) this.vis = new Visualizer(visualizer, this.game.shadow[0].length, this.game.shadow.length, this.game.viewerMap());
}

Coldbrew.prototype.initializeRobot = function() {
    var robot = this.game.initializeRobot();
    var code = (robot.team==0) ? this.player_one : this.player_two;

    var start_time = wallClock();

    try {
        var v = new CrossVM(code);
    } catch(error) {
        this.game.robotError("Failed to initialize: " + error,robot);
        return;
    }

    if (wallClock() - start_time < this.chess_init) {
        this.game.registerHook(v.turn.bind(v), robot.id);
    } else {
        this.game.robotError("Took too long to initialize.",robot);
    }
}

Coldbrew.prototype.emptyQueue = function() {
    while (!this.kill && this.game.init_queue > 0) {
        this.initializeRobot();
    }
}

Coldbrew.prototype.gameLoop = function() {
    this.emptyQueue();
    if (this.game.isOver() || this.kill) {
        clearInterval(this.gameLoopInterval);
        if (this.log_receiver) this.log_receiver(this.game.logs);
        if (this.replay_eater) {
            this.replay['logs'] = this.game.logs;
            this.replay['win_condition'] = this.game.win_condition;
            this.replay['winner'] = this.game.winner;
            this.replay_eater(this.replay);
        } else this.vis.gameOver(this.game.winner, this.game.win_condition);
    } else if (!(!this.replay_eater && this.vis.stopped())) {
        if (this.round == 0 && !this.replay_eater) this.vis.starting();
        this.game.enactTurn();

        if (this.game.round != this.round) {
            this.round = this.game.round;
            
            if (this.replay_eater) this.replay['rounds'].push(this.game.viewerMessage());
            else {
                this.vis.feedRound(this.round, this.game.viewerMessage());
                this.vis.setRound(this.round);
            }

            if (this.log_receiver) this.log_receiver(this.game.logs);
        }
    }
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
Coldbrew.prototype.playGame = function(log_receiver) {
    this.round = 0;

    this.log_receiver = log_receiver;
    if (this.replay_eater) {
        this.replay = {'rounds':[], 'seed':this.seed, 'logs':null, 'width':this.game.shadow[0].length, 'height':this.game.shadow.length, 'map': this.game.viewerMap()};
        this.replay['rounds'].push(this.game.viewerMessage());
    }
    
    this.gameLoopInterval = setInterval(this.gameLoop.bind(this),0);
}

Coldbrew.prototype.destroy = function() {
    clearInterval(this.gameLoopInterval);
    this.kill = true;
    if (this.vis) this.vis.scrub();
    this.game = {};
    this.vis = {};
    this.replay = {};
}

module.exports = {'Coldbrew': Coldbrew, 'Visualizer': Visualizer};