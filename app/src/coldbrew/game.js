var ROBOT_VISION = 7;
var ATTACK_PENALTY = 1;
var INITIAL_HP = 64;
var COMMUNICATION_BITS = 4;
var MAX_ROUNDS = 50;

var NEXUS_POISON_HP = 2;
var NEXUS_INCUBATOR_HP = 1;

var CHESS_INITIAL = 100;
var CHESS_EXTRA = 20;

// Check whether in browser or node.
function inBrowser() {
    return (typeof window !== "undefined");
}

// Deep copy a message for security purposes.
function insulate(message) {
    return JSON.parse(JSON.stringify(message));
}

// Get some sorta time in millis.
function wallClock() {
    if (inBrowser()) return window.performance.now();
    else return new Date().getTime();
}

/**
 * Game class.
 *
 * Note that (0,0) is top left.
 *
 * @constructor
 * @param {number} robots - The number of robots.
 * @param {number} map_size - The side length of the square map (power of 2).
* @param {number} seed - The seed for map generation.
 * @param {boolean} [debug=false] - Enables debug mode (default false).
 */
function Game(map_size, seed, num_robots, debug) {
    this.robots = [] // objects active in the game.
    this.ids = []; // list of "spent" item ids.

    this.seed = seed;
    this.num_robots = num_robots;
    this.round = 0;
    this.robin = Infinity;
    this.init_queue = 0; // how many robots have yet to be initialized.
    this.winner = undefined;
    this.win_condition = undefined; // 0 is robot annihilation, 1 is more health at end, 2 is random, 3 is opponent failed to initialize, 4 is both failed to initialize so random winner
    this.debug = debug || false;
    this.logs = [[],[]]; // list of JSON logs for each team
    this.nexi = [];

    // The shadow is a 2d map where 0 signifies empty, -1 impassable, and anything
    // else is the id of the robot/item occupying the square.  This is updated
    // after every action.
    this.shadow = new Array(map_size);
    for (var i=0; i<map_size; i++) {
        this.shadow[i] = new Array(map_size);
        for (var j=0; j<map_size; j++) {
            this.shadow[i][j] = 0;
        }
    }

    var to_create = this.makeMap(this.shadow, seed, num_robots); // list of robots
    for (var i=0; i<to_create.length; i++) {
        this.createItem(to_create[i].x, to_create[i].y, to_create[i].team);
    }
}

/**
 * Generate a map. Currently a placeholder.
 * 
 * @param {number[][]} x - The shadow to populate the map with.
 * @return {Object[]} - A list of robots with x, y, and team.
 */
Game.prototype.makeMap = function(x, seed, players) {
    function random() {
        var x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    }

    var player_odd = players/(0.8*x.length*x[0].length/2);
    
    var ret_players = [];

    for (var r=0; r<x.length/2; r++) {
        for (var c=0; c<x[0].length; c++) {
            x[r][c] = x[x.length-1-r][x[0].length-1-c] = random() > 0.8 ? -1 : 0;
            if (random() < player_odd && x[r][c] != -1) {
                var team = random() > 0.5 ? 1 : 0;
                ret_players.push({ team: team, x: c, y: r });
                ret_players.push({ team: 1-team, x:x[0].length-1-c, y:x.length-1-r });
            }
        }
    }    

    return ret_players;
}

Game.prototype.viewerMap = function() {
    var map = [];

    for (var r=0; r<this.shadow.length; r++) {
        for (var c=0; c<this.shadow[0].length; c++) {
            map.push(this.shadow[r][c] == -1);
        }
    }

    return map;
}

Game.prototype.viewerMessage = function() {
    return {robots:this.robots, nexi:this.nexi};
}

/**
 * Create and return an item at a location.
 * Also update the shadow with the item.
 *
 * @param {number} x - The x coordinate to create the item on.
 * @param {number} y - The x coordinate to create the item on.
 * @param {number} team - The team to create the robot on.
 * @returns {Object} The created item.
 */
Game.prototype.createItem = function(x,y,team) {
    var id = null;

    do id = Math.floor(4096 * Math.random());
    while (this.ids.indexOf(id) >= 0);

    var robot         = {'type':'robot'};
    robot.id          = id;
    robot.team        = team;
    robot.x           = x;
    robot.y           = y;

    robot.health      = INITIAL_HP;
    robot.initialized = false;
    robot.hook        = undefined; // the turn function
    robot.time        = CHESS_INITIAL; // time left in chess clock
    robot.start_time  = -1; // used for chess clock timing.
    robot.signal      = 0;
    this.init_queue++;

    if (this.shadow[robot.y][robot.x] == 0) this.shadow[robot.y][robot.x] = robot.id;
    this.robots.push(robot);
    
    return robot;
}
    

/**
 * Get and return a robot of a certain ID. If no such
 * robot exists, return null.
 *
 * @param {number} robot_id - The robot id to fetch.
 * @return {Object} The robot of that id, or null if it does not exist.
 */
Game.prototype.getItem = function(item_id) {
    var robot = this.robots[0];

    let i = 0;
    do robot = this.robots[i++];
    while (robot.id != item_id && i < this.robots.length);

    if (item_id != robot.id || i > this.robots.length) return null;

    return robot;
}

/**
 * Pretty print an error message regarding a robot.
 *
 * @param {string} message - The error message.
 * @param {Object} robot - The robot id to print for.
 */
Game.prototype.robotError = function(message, robot) {
    if (this.debug) {
        let team = robot.team==0?"red":"blue";
        if (inBrowser()) console.log("%c"+"[Robot "+robot.id+" Error] "
                                   + ("%c"+message),"color:"+team+";",
                                     "color:black;");
        //else console.log((robot.team==0?"\033[31m":"\033[34m")
        // XXX FIX XXX              + "[Robot "+robot.id+" Error]\033[0m " + message)
    } else this.logs[robot.team].push({
        'type':'error',
        'message':message,
        'robot':robot.id,
        'timestamp':wallClock()
    });
}


/**
 * Return whether the end game conditions are met.
 * Also sets this.winner and this.win_condition if true.
 *
 * @return {Boolean} Whether the game is over.
 */
Game.prototype.isOver = function() {
    var red = 0;
    var blue = 0;

    var nulls = [0,0];
    for (var i=0; i<this.robots.length; i++) {
        var robot = this.robots[i];
        if (robot.initialized && robot.hook != null) {
            if (robot.team == 0) red += robot.health;
            else blue += robot.health;
        } else nulls[robot.team]++;
    }

    if (red == 0) {
        this.winner = 1;
        this.win_condition = 0;
        if (this.debug) console.log("Game over, blue won by annihilation.");
        return true;
    } else if (blue == 0) {
        this.winner = 0;
        this.win_condition = 0;
        if (this.debug) console.log("Game over, red won by annihilation.");
        return true;
    } else if (this.round >= MAX_ROUNDS) {
        this.win_condition = 1;
        if (red > blue) {
            this.winner = 0;
            if (this.debug) console.log("Game over, red won by greater health.");
        } else if (blue < red) {
            this.winner = 1;
            if (this.debug) console.log("Game over, blue won by greater health.");
        } else {
            this.win_condition = 2;
            this.winner = +(Math.random() > 0.5);
            if (this.debug) console.log("Game over, " + (this.winner==0?"red":"blue") + " won by random draw.");
        }

        return true;
    }

    return false;
}


/**
 * Initialize a robot, and return its api.
 *
 * @param {function} init_time - Given the team, return the time limit (in millis) the bot has to register.
 * @return {Object} A dict of API names and functions.
 */
Game.prototype.initializeRobot = function() {
    var robot = this.robots[0];
    for (var i=0; robot.initialized; i++) {
        robot = this.robots[i];
    } robot.initialized = true;
    this.init_queue--;

    return robot;
}

/**
 * Register a robot hook (the turn function).
 *
 * @param {function} hook - The turn method for the robot.
 * @param {number} robot_id - The robot id the hook belongs to.
 */
Game.prototype.registerHook = function(hook, robot_id) {
    let robot = this.getItem(robot_id);
    robot.hook = hook;
}

Game.prototype._overflow = function(val) {
    if (val < 0) return this.shadow.length + val;
    else if (val >= this.shadow.length) return val - this.shadow.length;
    else return val;
}

/**
 * Returns a subsquare of the robots vision, with the robot at the center.
 *
 * @param {Object} robot - The robot object to get visible for.
 * @returns {number[][]} The subshadow.
 */
Game.prototype.getVisible = function(robot) {
    const view = Array(ROBOT_VISION).fill().map(() => Array(ROBOT_VISION).fill(0));
    var r = Math.floor(ROBOT_VISION/2);
    for (var _x=0; _x<ROBOT_VISION; _x++) {
        for (var _y=0; _y<ROBOT_VISION; _y++) {
            var x = this._overflow(_x + robot.x - r);
            var y = this._overflow(_y + robot.y - r);

            view[_y][_x] = this.shadow[y][x];
        }
    }

    return view;
}

/**
 * Calculates a new position in a given direction.
 * Internal use only.
 *
 * @param {number} x - The x coordinate to calc from.
 * @param {number} x - The x coordinate to calc from.
 * @param {number} x - The x coordinate to calc from.
 *
 * @return {number[]} - The new x,y coordinates, or null if off map/invalid.
 */
Game.prototype._newPosCalc = function(x, y, dir) {
    var new_pos = [x, y];
    if (dir == 0) new_pos[0] += 1;
    else if (dir == 1) { new_pos[0] += 1; new_pos[1] += 1; }
    else if (dir == 2) new_pos[1] += 1;
    else if (dir == 3) { new_pos[1] += 1; new_pos[0] -= 1; }
    else if (dir == 4) new_pos[0] -= 1;
    else if (dir == 5) { new_pos[1] -= 1; new_pos[0] -= 1; }
    else if (dir == 6) new_pos[1] -= 1;
    else if (dir == 7) { new_pos[0] += 1; new_pos[1] -= 1; }
    else return null;

    // wrap position
    if (new_pos[0] < 0) new_pos[0] += this.shadow[0].length;
    if (new_pos[0] >= this.shadow[1].length) new_pos[0] -= this.shadow[0].length;
    if (new_pos[1] < 0) new_pos[1] += this.shadow.length;
    if (new_pos[1] >= this.shadow[0].length) new_pos[1] -= this.shadow.length;

    return new_pos;
}

/**
 * Apply nexus unit incubation/destruction.
 * Internal use only.
 */
Game.prototype._applyNexi = function() {
    this.nexi = [];

    for (var r=0; r<this.shadow.length; r++) {
        for (var c=0; r<this.shadow[0].length; r++) {
            // check if the square is a nexus.
            var o = this.shadow[r][c];
            if (o == -1) continue;

            var sides = [
                this.shadow[this._overflow(r-1)][c],
                this.shadow[this._overflow(r+1)][c],
                this.shadow[r][this._overflow(c+1)],
                this.shadow[r][this._overflow(c-1)]
            ];

            var corners = [
                this.shadow[this._overflow(r-1)][this._overflow(c-1)],
                this.shadow[this._overflow(r-1)][this._overflow(c+1)],
                this.shadow[this._overflow(r+1)][this._overflow(c-1)],
                this.shadow[this._overflow(r+1)][this._overflow(c+1)]
            ];

            var corners_good = true;
            for (var i=0; i<4; i++) corners_good &= (corners[i] == 0);

            if (corners_good) {
                // make sure that all sides are robots on same team.
                var teams = [0,0];
                for (var i=0; i<4; i++) if (sides[i] > 0) 
                    teams[this.getItem(sides[i]).team] += 1;
                
                if (teams[0] == 4 || teams[1] == 4) { // all red or blue
                    this.nexi.push(sides);

                    var side_team = (teams[0] == 4) ? 0 : 1;
                    if (o == side_team) {
                        // create a side_team robot in r,c
                        var baby = this.createItem(c, r, side_team);
                        baby.health = NEXUS_INCUBATOR_HP;
                    } else {
                        var center = this.getItem(o);
                        if (center.team == side_team)
                            center.health += (center.health >= INITIAL_HP)?0:NEXUS_INCUBATOR_HP;
                        else sides.forEach(function(side) {
                            side.health -= NEXUS_POISON_HP;
                            if (side.health <= 0) {
                                var index = this.robots.indexOf(side);
                                this.robots.splice(index,1);
                                if (index < this.robin) this.robin--;
                            }
                        });
                    }
                }
            }
        }
    }
}

Game.prototype.getGameStateDump = function(robot) {
    var visible = [];
    var shadow = this.getVisible(robot);
    shadow.forEach(function(row) {
        row.forEach(function(v) {
            if (v <= 0) return;
            var robot = insulate(this.getItem(v));
            delete robot.team;
            delete robot.initialized;
            delete robot.hook;
            delete robot.time;
            delete robot.start_time;
            visible.push(robot);
        }.bind(this));
    }.bind(this));

    return JSON.stringify({shadow:shadow, visible:visible});
}

/**
 * Enact a turn for the next robot using its hook.
 *
 * Returns empty string if nothing went wrong.  If the move
 * is bad, return a string with the error message.
 *
 * @return {String} An error message or empty string.
 */
Game.prototype.enactTurn = function() {
    if (this.robin >= this.robots.length) {
        this.robin = 0;
        this.round++;
    }

    this._applyNexi();

    let robot = this.robots[this.robin];
    if (robot.hook == null || !robot.initialized) {
        return "Robot not initialized.";
    }

    robot.start_time = wallClock();

    let action = robot.hook(this.getGameStateDump(robot));

    let diff_time = wallClock() - robot.start_time;
    let response = this.enactAction(robot, action, diff_time);

    if (response != "") {
        this.robotError(response, robot);
    }
}


/**
 * Enact an action for a robot, and increment the turn.
 *
 * Returns empty string if nothing went wrong.  If the move
 * is bad, return a string with the error message.
 *
 * @param {Object} robot - The robot object to enact a turn on.
 * @param {Object} action - A well formed action message, as generated by the API.
 * @param {number} time - The amount of time spent in the turn by the robot.

 * @return {String} An error message or empty string.
 */
Game.prototype.enactAction = function(robot, action, time) {
    this.robin++;
    var new_round = false;
    if (this.robin == this.robots.length) this.robin++;

    robot.time -= time;
    if (robot.time < 0) {
        this.robots.splice(this.robots.indexOf(robot), 1);
        this.robin--;
        this.shadow[robot.y][robot.x] = 0;
        return "Timed out by " + robot.time*-1 + "ms.";
    } else robot.time += CHESS_EXTRA;


    if (action == null) return "";
    var valid = typeof action==='object' && action!==null && !(action instanceof Array) && !(action instanceof Date);
    valid = valid && 'action' in action && ['move','attack','signal'].indexOf(action['action']) >= 0;

    if (!valid) {
        console.log(action);
        return "Malformed move.";
    }

    if ('signal' in action && Number.isInteger(action.signal) && action.signal >= 0 && action.signal < Math.pow(2,COMMUNICATION_BITS)) {
        robot.signal = action.signal;
    }

    if (action.action == 'move') {
        if ('dir' in action && Number.isInteger(action.dir) && action.dir >= 0 && action.dir < 8) {
            var new_pos = this._newPosCalc(robot.x,robot.y,action.dir);

            if (this.shadow[new_pos[1]][new_pos[0]] == 0) {
                // space isn't occupied, so move into it.
                this.shadow[robot.y][robot.x] = 0;
                this.shadow[new_pos[1]][new_pos[0]] = robot.id;

                robot.x = new_pos[0];
                robot.y = new_pos[1];
            } else {
                // space is occupied, so don't move.
                return "Attempted to move into occupied square."
            }
        } else return "Malformed move.";        
    } else if (action.action == 'attack') {
        if ('dir' in action && Number.isInteger(action.dir) && action.dir >= 0 && action.dir < 8) {
            var new_pos = this._newPosCalc(robot.x,robot.y,action.dir);

            if (this.shadow[new_pos[1]][new_pos[0]] > 0) {
                // space has a robot in it.
                var victim = this.getItem(this.shadow[new_pos[1]][new_pos[0]]);
                victim.health -= ATTACK_PENALTY;

                if (victim.health == 0) {
                    this.shadow[new_pos[1]][new_pos[0]] = 0;

                    // delete robot
                    var victim_index = this.robots.indexOf(victim);
                    this.robots.splice(victim_index, 1);

                    if (victim_index < this.robin) this.robin--;
                }
            } else {
                // space is occupied, so don't move.
                return "Attempted to attack a space without a robot."
            }
        } else return "Malformed move.";        
    }    

    return "";
}

export default Game;
