var Game = require('./game');
var CrossVM = require('./vm');

function wallClock() {
    if (typeof window !== 'undefined') return window.performance.now();
    else return new Date().getTime();
}

function Coldbrew(game, on_start, on_end, log_receiver) {
    this.kill = false;

    this.game = game;
    this.on_start = on_start;
    this.on_end = on_end;
    this.log_receiver = log_receiver;

    this.stopped = false;

}

Coldbrew.prototype.initializeRobot = function() {
    var robot = this.game.initializeRobot();
    var code = (robot.team==0) ? this.player_one : this.player_two;

    var start_time = wallClock();

    try {
        var v = new CrossVM(code);
    } catch(error) {
        this.game.robotError("Failed to initialize: " + error.stack,robot);
        return;
    }

    if (wallClock() - start_time < this.game.chess_initial) {
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

Coldbrew.prototype.stop = function() {
    this.stopped = true;
}

Coldbrew.prototype.unstop = function() {
    this.stopped = false;
}


Coldbrew.prototype.gameLoop = function() {
    this.emptyQueue();
    if (this.game.isOver() || this.kill) {
        clearInterval(this.gameLoopInterval);
        if (this.log_receiver) this.log_receiver(this.game.logs);
        if (this.on_end) this.on_end(this.game.logs);
    } else if (!this.stopped) {
        if (this.round == 0 && this.on_start) this.on_start();
        this.game.enactTurn();

        if (this.game.round != this.round) {
            this.round = this.game.round;

            if (this.log_receiver) this.log_receiver(this.game.logs);
        }
    }
}

/**
 * Start a game.
 *
 * @param {Object} player_one - The red source.
 * @param {Object} player_two - The blue source.
 */
Coldbrew.prototype.playGame = function(player_one, player_two) {
    this.round = 0;

    this.player_one = player_one;
    this.player_two = player_two;

    this.gameLoopInterval = setInterval(this.gameLoop.bind(this),0);
}

Coldbrew.prototype.destroy = function() {
    clearInterval(this.gameLoopInterval);
    
    this.kill = true;
    this.game = {};
}

module.exports = Coldbrew;