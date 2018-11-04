var ROBOT_VISION = 7;
var ATTACK_PENALTY = 2;
var INITIAL_HP = 64;
var COMMUNICATION_BITS = 4;
var MAX_ROUNDS = 200;

var NEXUS_INCUBATOR_HP = 1;
var MAP_SPARSITY = 0.8;

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
function Game(seed, chess_initial, chess_extra, debug) {    
    this.robots = [] // objects active in the game.
    this.ids = []; // list of "spent" item ids.

    this.chess_initial = chess_initial;
    this.chess_extra = chess_extra;

    this.seed = seed;
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
    
    var to_create = this.makeMap(); // list of robots
    for (i=0; i<to_create.length; i++) {
        this.createItem(to_create[i].x, to_create[i].y, to_create[i].team);
    }
}

/**
 * Generate a map.
 * 
 * @param {Object[]} to_create - A list of robots to create.
 * @return {Object[]} - A list of robots with x, y, and team.
 */
Game.prototype.makeMap = function() {
    var random = function() {
        var x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }.bind(this);

    var width = 15 + Math.floor(16.0*random());
    var height = 15 + Math.floor(16.0*random());
    if (height%2 === 1) height++; // ensure height is even
    if (width%2  === 1) width++;

    this.shadow = new Array(height);
    for (var i=0; i<height; i++) {
        this.shadow[i] = new Array(width);
        for (var j=0; j<width; j++) {
            this.shadow[i][j] = 0;
        }
    }

    var players = 6 + Math.floor(6*random());
    var player_odd = players/(0.8*height*width);
    
    var to_create = [];
    for (var r=0; r<height/2; r++) {
        for (var c=0; c<width; c++) {
            this.shadow[r][c] = this.shadow[height-1-r][width-1-c] = random() > MAP_SPARSITY ? -1 : 0;
            if (random() < player_odd && this.shadow[r][c] !== -1) {
                var team = random() > 0.5 ? 1 : 0;
                to_create.push({ team: team, x: c, y: r });
                to_create.push({ team: 1-team, x:width-1-c, y:height-1-r });
            }
        }
    }

    if (to_create.length < 10) return this.makeMap();

    return to_create;
}

Game.prototype.viewerMap = function() {
    var map = [];

    for (var r=0; r<this.shadow.length; r++) {
        for (var c=0; c<this.shadow[0].length; c++) {
            map.push(this.shadow[r][c] === -1);
        }
    }

    return insulate(map);
}

Game.prototype.viewerMessage = function() {
    return insulate({robots:this.robots, nexi:this.nexi});
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

    do id = 10+Math.floor(4086 * Math.random());
    while (this.ids.indexOf(id) >= 0);
    this.ids.push(id);

    var robot         = {'type':'robot'};
    robot.id          = id;
    robot.team        = team;
    robot.x           = x;
    robot.y           = y;

    robot.health      = INITIAL_HP;
    robot.initialized = false;
    robot.hook        = null; // the turn function
    robot.time        = this.chess_initial; // time left in chess clock
    robot.start_time  = -1; // used for chess clock timing.
    robot.signal      = 0;
    robot.counter     = 0;
    this.init_queue++;

    if (this.shadow[robot.y][robot.x] === 0) this.shadow[robot.y][robot.x] = robot.id;
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

    var i = 0;
    do robot = this.robots[i++];
    while (robot.id !== item_id && i < this.robots.length);

    if (item_id !== robot.id || i > this.robots.length) return null;

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
        var team = robot.team===0?"red":"blue";
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
 * Pretty print a log message regarding a robot.
 *
 * @param {string} message - The message.
 * @param {Object} robot - The robot id to print for.
 */
Game.prototype.robotLog = function(message, robot) {
    if (this.debug) {
        var team = robot.team===0?"red":"blue";
        if (inBrowser()) console.log("%c"+"[Robot "+robot.id+" Log] "
                                   + ("%c"+message),"color:"+team+";",
                                     "color:black;");
        //else console.log((robot.team==0?"\033[31m":"\033[34m")
        // XXX FIX XXX              + "[Robot "+robot.id+" Error]\033[0m " + message)
    } else this.logs[robot.team].push({
        'type':'log',
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
    var total = [0,0]
    for (var i=0; i<this.robots.length; i++) {
        var robot = this.robots[i];
        total[robot.team]++;
        if (robot.initialized) {
            if (robot.hook) {
                if (robot.team === 0) red += robot.health;
                else blue += robot.health;
            } else nulls[robot.team]++;
        }
    }

    if (nulls[0] === total[0] && nulls[1] === total[1]) {
        this.winner = +(Math.random() > 0.5);
        this.win_condition = 2;
        return true;
    } else if (nulls[0] === total[0]) {
        this.winner = 1;
        this.win_condition = 0;
        return true;
    } else if (nulls[1] === total[1]) {
        this.winner = 0;
        this.win_condition = 0;
        return true;
    }

    if (red === 0) {
        this.winner = 1;
        this.win_condition = 0;
        if (this.debug) console.log("Game over, blue won by annihilation.");
        return true;
    } else if (blue === 0) {
        this.winner = 0;
        this.win_condition = 0;
        if (this.debug) console.log("Game over, red won by annihilation.");
        return true;
    } else if (this.round >= MAX_ROUNDS) {
        this.win_condition = 1;
        if (red > blue) {
            this.winner = 0;
            if (this.debug) console.log("Game over, red won by greater health.");
        } else if (blue > red) {
            this.winner = 1;
            if (this.debug) console.log("Game over, blue won by greater health.");
        } else {
            this.win_condition = 2;
            this.winner = +(Math.random() > 0.5);
            if (this.debug) console.log("Game over, " + (this.winner===0?"red":"blue") + " won by random draw.");
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
    var robot = this.getItem(robot_id);
    robot.hook = hook;
    //console.log("Registered Robot " + robot.id + " with " + robot.hook);
}

Game.prototype._overflow_y = function(val) {
    if (val < 0) return this.shadow.length + val;
    else if (val >= this.shadow.length) return val - this.shadow.length;
    else return val;
}

Game.prototype._overflow_x = function(val) {
    if (val < 0) return this.shadow[0].length + val;
    else if (val >= this.shadow[0].length) return val - this.shadow[0].length;
    else return val;
}

/**
 * Returns a subsquare of the robots vision, with the robot at the center.
 *
 * @param {Object} robot - The robot object to get visible for.
 * @returns {number[][]} The subshadow.
 */
Game.prototype.getVisible = function(robot) {
    var view = Array(ROBOT_VISION);
    for (var i=0; i<ROBOT_VISION; i++) view[i]=Array(ROBOT_VISION);
    var r = Math.floor(ROBOT_VISION/2);

    for (var _x=0; _x<ROBOT_VISION; _x++) {
        for (var _y=0; _y<ROBOT_VISION; _y++) {
            var x = this._overflow_x(_x + robot.x - r);
            var y = this._overflow_y(_y + robot.y - r);

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
    if (dir === 0) new_pos[0] += 1;
    else if (dir === 1) { new_pos[0] += 1; new_pos[1] -= 1; }
    else if (dir === 2) new_pos[1] -= 1;
    else if (dir === 3) { new_pos[1] -= 1; new_pos[0] -= 1; }
    else if (dir === 4) new_pos[0] -= 1;
    else if (dir === 5) { new_pos[1] += 1; new_pos[0] -= 1; }
    else if (dir === 6) new_pos[1] += 1;
    else if (dir === 7) { new_pos[0] += 1; new_pos[1] += 1; }
    else return null;

    // wrap position
    if (new_pos[0] < 0) new_pos[0] += this.shadow[0].length;
    if (new_pos[0] >= this.shadow[0].length) new_pos[0] -= this.shadow[0].length;
    if (new_pos[1] < 0) new_pos[1] += this.shadow.length;
    if (new_pos[1] >= this.shadow.length) new_pos[1] -= this.shadow.length;

    return new_pos;
}

/**
 * Apply nexus unit incubation/destruction.
 * Internal use only.
 */
Game.prototype._applyNexi = function() {
    this.nexi = [];

    for (var r=0; r<this.shadow.length; r++) {
        for (var c=0; c<this.shadow[0].length; c++) {
            // Check if the square is occupied
            var o = this.shadow[r][c];
            if (o === -1 || o === 0) continue;
            var this_robot = this.getItem(o);

            // List of (nexus_center, opposer)
            var neighbors = [
                [[this._overflow_y(r-1),  c],                   [this._overflow_y(r-2), c]],
                [[this._overflow_y(r+1),this._overflow_x(c-1)], [this._overflow_y(r+2), this._overflow_x(c-2)]],
                [[this._overflow_y(r-1),this._overflow_x(c-1)], [this._overflow_y(r-2), this._overflow_x(c-2)]],
                [[r, this._overflow_x(c-1)],                    [r, this._overflow_x(c-2)]],
            ];

            for (var i=0; i<neighbors.length; i++) {
                var center_coords = neighbors[i][0];
                var opposed_coords = neighbors[i][1];
                var center = this.shadow[center_coords[0]][center_coords[1]];
                var opposed = this.shadow[opposed_coords[0]][opposed_coords[1]];

                if (opposed <= 0 || center === -1) continue;
                var opposing_robot = this.getItem(opposed);
                if (opposing_robot.team !== this_robot.team) continue;

                // If center square is empty
                if (center === 0) {
                    this.createItem(center_coords[1], center_coords[0], this_robot.team).health = NEXUS_INCUBATOR_HP;
                    this.nexi.push([[r,c], opposed_coords]);
                    continue;
                }

                var center_robot = this.getItem(center);

                // If center square is occupied by friend
                if (center_robot.team === this_robot.team) {
                    if (center_robot.health < INITIAL_HP) center_robot.health++;
                    this.nexi.push([[r,c], opposed_coords]);
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
            var r = insulate(this.getItem(v));
            delete r.initialized;
            delete r.hook;
            delete r.time;
            delete r.start_time;
            if (robot.id !== r.id) {
                delete r.health;
                delete r.team;
            }
            visible.push(r);
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
        this._applyNexi();
        this.robin = 0;
        this.round++;

    }

    var robot = this.robots[this.robin];
    if (robot.hook === null || !robot.initialized) {
        this.robotError("Robot not initialized", robot)
        this.enactAction(robot, null, 0);
        return
    }

    var action = null;
    var dump = this.getGameStateDump(robot);

    robot.start_time = wallClock();

    try {
        action = robot.hook(dump);
    } catch (e) {
        //console.log(e);
        this.robotError(e.toString(), robot);
    }
    
    var diff_time = wallClock() - robot.start_time;
    var response = this.enactAction(robot, action, diff_time);

    if (response !== "") {
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
    if (this.robin === this.robots.length) this.robin++;

    robot.time -= time;
    if (robot.time < 0) {
        this.robots.splice(this.robots.indexOf(robot), 1);
        this.robin--;
        this.shadow[robot.y][robot.x] = 0;
        return "Timed out by " + robot.time*-1 + "ms.";
    } else robot.time += this.chess_extra;


    if (action === null) return "";

    var valid = typeof action==='object' && action!==null && !(action instanceof Array) && !(action instanceof Date);
    if (!valid) {
        if (this.debug) console.log(action);
        return "Malformed move.";
    }

    if ('logs' in action && 'length' in action['logs']) {
        for (var l=0; l<action['logs'].length; l++) {
            if (typeof action['logs'][l] === "string") this.robotLog(action['logs'][l], robot);
            else console.log(action['logs'][l]);
        }
    }

    if ('signal' in action && action['signal'] !== null) {
        if (Number.isInteger(action.signal) && action.signal >= 0 && action.signal < Math.pow(2,COMMUNICATION_BITS)) {
            robot.signal = action.signal;
        } else return "Invalid signal message.";
    }

    valid = valid && 'action' in action && ['move','attack'].indexOf(action['action']) >= 0;

    if (valid && action.action === 'move') {
        if ('dir' in action && Number.isInteger(action.dir) && action.dir >= 0 && action.dir < 8) {
            var new_pos = this._newPosCalc(robot.x,robot.y,action.dir);

            if (this.shadow[new_pos[1]][new_pos[0]] === 0) {
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
    } else if (valid && action.action === 'attack') {
        if ('dir' in action && Number.isInteger(action.dir) && action.dir >= 0 && action.dir < 8) {
            var new_pos = this._newPosCalc(robot.x,robot.y,action.dir);

            if (this.shadow[new_pos[1]][new_pos[0]] > 0) {
                // space has a robot in it.
                var victim = this.getItem(this.shadow[new_pos[1]][new_pos[0]]);
                victim.health -= ATTACK_PENALTY;

                if (victim.health === 0) {
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

module.exports = Game;