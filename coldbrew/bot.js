function insulate(content) {
    return JSON.parse(JSON.stringify(content));
}

class BCAbstractRobot {
    constructor() {
        this._bc_in_browser = (typeof _bc_browser_log !== 'undefined');
        this._reset_state();
    }

    // Hook called by runtime, sets state and calls turn.
    _do_turn(game_state) {
        this._bc_game_state = game_state;
        this.id = game_state.id;
        this.karbonite = game_state.karbonite;
        this.fuel = game_state.fuel;
        this.last_offer = game_state.last_offer;

        this.me = this.getRobot(this.id);

        var t = this.turn();
        if (!t) t = this._bc_null_action();

        this._reset_state();

        return t;
    }

    _reset_state() {
        // Internal robot state representation
        this._bc_logs = [];
        this._bc_signal = 0;
        this._bc_signal_radius = 0;
        this._bc_game_state = null;
        this._bc_castle_talk = 0;
        this.me = null;
        this.id = null;
        this.fuel = null;
        this.karbonite = null;
        this.last_offer = null;
    }

    // Action template
    _bc_null_action() {
        return {
            'signal': this._bc_signal,
            'signal_radius': this._bc_signal_radius,
            'logs': this._bc_logs,
            'castle_talk': this._bc_castle_talk
        };
    }

    _bc_action(action, properties) {
        var a = this._bc_null_action();
        for (var key in properties) { a[key] = properties[key]; }
        a['action'] = action;
        return a;
    }
    
    // Set signal value.
    signal(value, radius) {
        // Check if enough fuel to signal, and that valid value.

        if (this.fuel < radius) throw "Not enough fuel to signal given radius.";
        if (!Number.isInteger(value) || value < 0 || value >= Math.pow(2,SPECS.COMMUNICATION_BITS)) throw "Invalid signal, must be int within bit range.";

        this._bc_signal = value;
        this._bc_signal_radius = radius;

        this.fuel -= radius;
    }

    // Set castle talk value.
    castleTalk(value) {
        // Check if enough fuel to signal, and that valid value.

        if (!Number.isInteger(value) || value < 0 || value >= Math.pow(2,SPECS.CASTLE_TALK_BITS)) throw "Invalid castle talk, must be between 0 and 2^8.";

        this._bc_castle_talk = value;
    }

    proposeTrade(karbonite, fuel) {
        if (this.me.unit !== SPECS.CASTLE) throw "Only castles can trade.";
        if (!Number.isInteger(karbonite) || !Number.isInteger(fuel)) throw "Must propose integer valued trade."
        if (Math.abs(karbonite) >= SPECS.MAX_TRADE || Math.abs(fuel) >= SPECS.MAX_TRADE) throw "Cannot trade over " + SPECS.MAX_TRADE + " in a given turn.";

        return this._bc_action('trade', {
            trade_fuel: fuel,
            trade_karbonite: karbonite
        });
    }

    buildUnit(unit, dx, dy) {
        if (this.me.unit !== SPECS.PILGRIM && this.me.unit !== SPECS.CASTLE && this.me.unit !== SPECS.CHURCH) throw "This unit type cannot build.";
        if (this.me.unit === SPECS.PILGRIM && unit !== SPECS.CHURCH) throw "Pilgrims can only build churches.";
        if (this.me.unit !== SPECS.PILGRIM && unit === SPECS.CHURCH) throw "Only pilgrims can build churches.";
        
        if (!Number.isInteger(dx) || !Number.isInteger(dx) || dx < -1 || dy < -1 || dx > 1 || dy > 1) throw "Can only build in adjacent squares.";
        if (this._bc_game_state.shadow[this.me.y+dy][this.me.x+dx] !== 0) throw "Cannot build on occupied tile.";
        if (!this._bc_game_state.map[this.me.y+dy][this.me.x+dx]) throw "Cannot build onto impassable terrain.";
        if (this.karbonite < SPECS.UNITS[unit].CONSTRUCTION_KARBONITE || this.fuel < SPECS.UNITS[unit].CONSTRUCTION_FUEL) throw "Cannot afford to build specified unit.";

        return this._bc_action('build', {
            dx: dx,
            dy: dy,
            build_unit: unit
        });
    }


    // Get robot of a given ID
    getRobot(id) {
        if (id <= 0) return null;
        for (var i=0; i<this._bc_game_state.visible.length; i++) {
            if (this._bc_game_state.visible[i].id === id) {
                return insulate(this._bc_game_state.visible[i]);
            }
        } return null;
    }

    // Get map of visible robot IDs.
    getVisibleMap() {
        return insulate(this._bc_game_state.shadow);
    }

    // Get boolean map of passable terrain.
    getPassableMap() {
        return insulate(this._bc_game_state.map);
    }

    // Get boolean map of karbonite points.
    getKarboniteMap() {
        return insulate(this._bc_game_state.karbonite_map);
    }

    // Get boolean map of impassable terrain.
    getFuelMap() {
        return insulate(this._bc_game_state.fuel_map);
    }

    // Get a list of robots visible to you.
    getVisibleRobots() {
        return insulate(this._bc_game_state.visible);
    }

    // If in browser, direct print, otherwise put in message.
    log(message) {
        if (this._bc_in_browser) _bc_browser_log(this.id, ""+message);
        else this._bc_logs.push(""+message);
    }

    turn() {
        return null;
    }
}

built = false

class MyRobot extends BCAbstractRobot {
    turn() {
        if (this.me.unit === SPECS.PILGRIM) {
            this.castleTalk(5);
            this.log("I am a pilgrim!  I live at " + this.me.x + ", " + this.me.y);
        }

        else {

            var m = this.getVisibleMap();
            if (!built) {
                this.log("Building a pilgrim at " + (this.me.x+1) + ", " + (this.me.y+1));
                built = true;
                return this.buildUnit(SPECS.PILGRIM, 1, 1);
            }
        }
    }
}

var robot = {'robot':new MyRobot()};