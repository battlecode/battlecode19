var fs = require('fs');
import Coldbrew from './runtime'

var code = `
let bc = {
    'NORTH':     2,
    'NORTHEAST': 1,
    'EAST':      0,
    'SOUTHEAST': 7,
    'SOUTH':     6,
    'SOUTHWEST': 5,
    'WEST':      4,
    'NORTHWEST': 3,
    'EMPTY':     0,
    'HOLE':     -1
}

class BCAbstractRobot {
    constructor() {
        // Internal robot state representation
        this._bc_game_state = null;
        this._bc_signal = null;

        this._bc_in_browser = (typeof _bc_browser_log !== 'undefined');
        this._bc_logs = [];
        this._bc_clear_logs = false;

        // Robot id, never changes.
        this.id = null;
    }

    // Hook called by runtime, sets state and calls turn.
    _do_turn(game_state) {
        this._bc_game_state = game_state;
        if (!this.id) this.id = this.me().id;
        var t = this.turn();
        if (t === null) t = this._bc_null_action();

        this._bc_clear_logs = true;
        return t;
    }

    // Action template
    _bc_action(dir, action) {
        return {
            'signal': this.signal,
            'logs': this._bc_logs,
            'dir': dir,
            'action': action
        };
    }

    // Action template
    _bc_null_action() {
        return {
            'signal': this.signal,
            'logs': this._bc_logs
        };
    }
    
    // Set signal value.
    signal(value) {
        this.signal = value;
    }

    // Get robot of a given ID
    getRobot(id) {
        if (id <= 0) return null;
        for (var i=0; i<this._bc_game_state.visible.length; i++) {
            if (this._bc_game_state.visible[i].id === id) {
                return this._bc_game_state.visible[i];
            }
        } return null;
    }

    // Get current robot vision.
    getVisibleMap() {
        return this._bc_game_state.shadow;
    }

    // Get a list of robots visible to you.
    getVisibleRobots() {
        return this._bc_game_state.visible;
    }

    // Get me.
    me() {
        return this.getRobot(this.getVisibleMap()[3][3]);
    }

    // Get the square dx, dy away.
    getRelativePos(dX, dY) {
        if (dX < -3 || dX > 3 || dY < -3 || dY > 3) return null;
        var vis = this.getVisibleMap()[dY][dX];

        if (vis > 0) return this.getRobot(vis);
        else return vis;
    }

    // If in browser, direct print, otherwise put in message.
    log(message) {
        if (this._bc_clear_logs) {
            this._bc_logs = [];
            this._bc_clear_logs = false;
        }

        if (this._bc_in_browser) _bc_browser_log(this.id, message);
        else this._bc_logs.push(message);
    }

    // Move in a direction
    move(direction) {
        return this._bc_action(direction, 'move');
    }

    // Attack in a direction
    attack(direction) {
        return this._bc_action(direction, 'attack');
    }

    turn() {
        return null;
    }
}


class MyRobot extends BCAbstractRobot {
    turn() {
        return this.move(bc.NORTH);
    }
}

var robot = {'robot':new MyRobot()};
`

var seed = Math.floor(10000*Math.random());
let c = new Coldbrew(null, seed, function(replay) {
    var r = JSON.stringify(replay);
    fs.writeFileSync("replay.json",r,{encoding:'utf8',flag:'w'});
});

c.playGame(code, code);