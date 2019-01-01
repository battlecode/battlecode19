var SPECS = require('./specs');

var COMMUNICATION_BITS = 16;
var CASTLE_TALK_BITS = 8;
var MAX_ROUNDS = 1000;
var INITIAL_KARBONITE = 100;
var INITIAL_FUEL = 100;
var MINE_FUEL_COST = 1;
var KARBONITE_YIELD = 3;
var FUEL_YIELD = 3;

var CASTLE   = 0;
var CHURCH   = 1;
var PILGRIM  = 2;
var CRUSADER = 3;
var PROPHET  = 4;
var PREACHER = 5;

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
    this.win_condition = undefined; // 0 is more castles, 1 is more unit karbonite value at end, 2 is random, 3 is opponent failed to initialize, 4 is both failed to initialize so random winner
    this.debug = debug || false;
    this.logs = [[],[]]; // list of JSON logs for each team

    this.karbonite = [INITIAL_KARBONITE,INITIAL_KARBONITE];
    this.fuel      = [INITIAL_FUEL, INITIAL_FUEL];
    this.last_offer = [[0,0],[0,0]];

    // The shadow is a 2d map where 0 signifies empty, -1 impassable, and anything
    // else is the id of the robot/item occupying the square.  This is updated
    // after every action.
    
    var to_create = this.makeMap(); // list of robots
    for (i=0; i<to_create.length; i++) {
        this.createItem(to_create[i].x, to_create[i].y, to_create[i].team, CASTLE);
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

    var width = 50;
    var height = 50;

    function make_map(default) {
        var x = new Array(height);
        for (var i=0; i<height; i++) {
            x[i] = new Array(width);
            for (var j=0; j<width; j++) {
                x[i][j] = default;
            }
        } return x;
    }

    this.shadow = make_map(0);
    this.karbonite_map = make_map(false);
    this.fuel_map = make_map(false);

    to_create = [
        {team:0, x:2, y:2},
        {team:1, x:47, y:47}
    ];

    this.fuel_map[4][4] = this.fuel_map[45][45] = true;
    this.karbonite_map[6][6] = this.karbonite_map[43][43] = true;

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
    return insulate(this.robots);
}

/**
 * Create and return an item at a location.
 * Also update the shadow with the item.
 *
 * @param {number} x - The x coordinate to create the item on.
 * @param {number} y - The x coordinate to create the item on.
 * @param {number} team - The team to create the robot on.
 * @param {number} unit - The unit class to be created.
 * @returns {Object} The created item.
 */
Game.prototype.createItem = function(x,y,team,unit) {
    var id = null;

    do id = 10+Math.floor(4086 * Math.random());
    while (this.ids.indexOf(id) >= 0);
    this.ids.push(id);

    var robot         = {'type':'robot'};
    robot.id          = id;
    robot.team        = team; // 0 is red, 1 is blue
    robot.x           = x;    // (0,0) should be top left
    robot.y           = y;
    robot.unit        = unit;

    robot.health      = SPECS[unit]['STARTING_HP'];
    robot.karbonite   = 0;
    robot.fuel        = 0;    // current holding

    robot.signal      = 0;    // COMMUNICATION_BITS max
    robot.signal_radius = 0;  // r^2
    robot.castle_talk = 0;    // talk to god
    robot.doing       = null; // action the robot last performed

    robot.initialized = false;
    robot.hook        = null; // the turn function
    robot.time        = this.chess_initial; // time left in chess clock
    robot.start_time  = -1; // used for chess clock timing.

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
    var castles = [0,0];


    // 0 is more castles
    // 1 is more unit health at end
    // 2 is random
    // 3 is opponent failed to initialize
    // 4 is both failed to initialize so random winner
    
    var nulls = [0,0];
    var total = [0,0];
    for (var i=0; i<this.robots.length; i++) {
        var robot = this.robots[i];
        total[robot.team]++;
        if (robot.initialized) {
            if (robot.hook) {
                if (robot.team === 0) red += robot.health;
                else blue += robot.health;

                if (robot.unit === CASTLE) castles[robot.team]++;
            } else nulls[robot.team]++;
        }
    }

    if (nulls[0] === total[0] && nulls[1] === total[1]) {
        this.winner = +(Math.random() > 0.5);
        this.win_condition = 4;
        if (this.debug) console.log("Both teams failed to initialize.");
        return true;
    } else if (nulls[0] === total[0]) {
        this.winner = 1;
        this.win_condition = 3;
        if (this.debug) console.log("Red failed to initialize.");
        return true;
    } else if (nulls[1] === total[1]) {
        this.winner = 0;
        this.win_condition = 3;
        if (this.debug) console.log("Blue failed to initialize.");
        return true;
    } else if (castles[0] === 0 && castles[1] !== 0) {
        this.winner = 1;
        this.win_condition = 0;
        if (this.debug) console.log("Game over, blue won by castle annihilation.");
        return true;
    } else if (castles[0] !== 0 && castles[1] === 0) {
        this.winner = 1;
        this.win_condition = 0;
        if (this.debug) console.log("Game over, red won by castle annihilation.");
        return true;
    } else if (castles[0] === 0 && castles[1] === 0) {
        this.win_condition = 2;
        this.winner = +(Math.random() > 0.5);
        if (this.debug) console.log("Game over, " + (this.winner===0?"red":"blue") + " won by random draw each with no castles.");
        return true;
    } else if (this.round >= MAX_ROUNDS) {
        if (castles[0] !== castles[1]) {
            this.winner = castles[1] > castles[0] ? 1 : 0;
            this.win_condition = 0;
            if (this.debug) console.log("Game over, " + (this.winner===0?"red":"blue") + " won by more castles.");
        } else {
            if (red !== blue) {
                this.winner = red > blue ? 0 : 1;
                if (this.debug) console.log("Game over, " + (this.winner===0?"red":"blue") + " won by greater health.");
            } else {
                this.win_condition = 2;
                this.winner = +(Math.random() > 0.5);
                if (this.debug) console.log("Game over, " + (this.winner===0?"red":"blue") + " won by random draw.");
            } this.win_condition = 1;
        } return true;
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

/**
 * Returns a masked version of the shadow for a given robot.
 *
 * @param {Object} robot - The robot object to get visible for.
 * @returns {number[][]} The subshadow.
 */
Game.prototype.getVisible = function(robot) {
    var view = Array(this.shadow.length);
    for (var i=0; i<this.shadow.length; i++) view[i]=Array(this.shadow[0].length);
    
    var r = SPECS[robot.unit]['VISION_RADIUS'];

    for (var r=0; x<this.shadow.length; r++) {
        for (var c=0; c<this.shadow[0].length; c++) {
            if (Math.pow(robot.x - c,2) + Math.pow(robot.y - r,2) <= r) {
                view[r][c] = this.shadow[r][c];
            }
        }
    }

    return view;
}


Game.prototype.getGameStateDump = function(robot) {
    var visible = [];
    var shadow = this.getVisible(robot);

    var is_castle = robot.unit === CASTLE;
    for (var i=0; i<this.robots.length; i++) {
        var d = Math.pow(robot.x - this.robots[i].x,2) + Math.pow(robot.y - this.robots[i].y,2);
        var visible = d <= SPECS[robot.unit]['VISION_RADIUS'];
        var radioable = d <= this.robots[i].signal_radius;

        if (!visible && !radioable && !is_castle) continue;

        var r = insulate(this.robots[i]);
        
        delete r.initialized;
        delete r.hook;
        delete r.time;
        delete r.start_time;
        delete r.doing;

        if (robot.id !== r.id) {
            delete r.health;
            delete r.karbonite;
            delete r.fuel;
        }

        if (!radioable) {
            delete r.signal;
            delete r.signal_radius;
        }

        if (!visible) {
            delete r.x;
            delete r.y;
            delete r.unit;
            delete r.team;
        }

        if (!is_castle) delete r.castle_talk;

        visible.push(r);

    }

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
    robot.doing = action;

    this.robin++;
    if (this.robin === this.robots.length) this.robin++;

    robot.time -= time;
    if (robot.time < 0) {
        this.robots.splice(this.robots.indexOf(robot), 1);
        this.robin--;
        this.shadow[robot.y][robot.x] = 0;
        return "Timed out by " + robot.time*-1 + "ms.";
    } else robot.time += this.chess_extra;

    function int_param(param) {
        return param in action && action[param] !== null && Number.isInteger(action[param]);
    }

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

    if ('signal' in action) {
        if (int_param('signal') && int_param('signal_radius') && action.signal >= 0 && action.signal < Math.pow(2,COMMUNICATION_BITS) && action.signal_radius >= 0) {
            
            var fuel_cost = action.signal_radius;

            if (robot.fuel >= fuel_cost) {
                robot.fuel -= fuel_cost;
                robot.signal_radius = action.signal_radius;
                robot.signal = action.signal;
            } else return "Insufficient fuel to signal given radius.";

        } else return "Invalid signal message.";
    }

    if ('castle_talk' in action) {
        if (int_param('castle_talk') && action.castle_talk >= 0 && action.castle_talk < Math.pow(2,CASTLE_TALK_BITS)) {
            robot.castle_talk = action.castle_talk;
        } else return "Invalid church talk."
    }

    valid = 'action' in action && ['move','attack','build','mine','trade','give'].indexOf(action['action']) >= 0;
    if (!valid) return "";

    if (action.action === 'trade') {
        if (robot.unit !== CASTLE) return "Only Castles can trade.";

        if (int_param('trade_fuel') && int_param('trade_karbonite')) {
            // trade_fuel and trade_karbonite are the amount given by red, or received by blue.
            // for example, for red to offer a trade of 10 karbonite for 10 fuel, it would be karbonite=10 and fuel=-10.

            this.last_offer[robot.team] = [action.trade_karbonite, action.trade_fuel];
            
            // if the most recent blue offer is equal to the most recent red offer, the deal is enacted if payable, and nullified if not.
            if (this.last_offer[0][0] === this.last_offer[1][0] && this.last_offer[0][1] === this.last_offer[1][1]) {
                this.last_offer = [[0,0],[0,0]];

                // Check if deal is payable
                if (this.karbonite[0] >= action.trade_karbonite && this.karbonite[1] >= -1*action.trade_karbonite &&
                    this.fuel[0] >= action.trade_fuel && this.fuel[1] >= -1*action.trade_fuel) {

                    // Enact the deal
                    this.karbonite[0] -= action.trade_karbonite;
                    this.karbonite[1] += action.trade_karbonite;
                    this.fuel[0] -= action.trade_fuel;
                    this.fuel[1] += action.trade_fuel;

                } else return "Agreed trade deal is not payable.";
            }

        } else return "Must provide valid fuel and karbonite offers.";
    }

    else if (action.action === 'mine') {
        if (robot.unit !== PILGRIM) return "Only Pilgrims can mine.";
        if (this.fuel[robot.team] - MINE_FUEL_COST < 0) return "Not enough fuel to mine.";

        if (this.karbonite_map[robot.y][robot.x] && robot.karbonite + KARBONITE_YIELD <= SPECS[PILGRIM]['KARBONITE_CAPACITY']) {
            robot.karbonite += KARBONITE_YIELD;
            this.fuel[robot.team] -= MINE_FUEL_COST;
        }
        else if (this.fuel_map[robot.y][robot.x] && robot.fuel + FUEL_YIELD <= SPECS[PILGRIM]['FUEL_CAPACITY']) {
            robot.fuel += FUEL_YIELD;
            this.fuel[robot.team] -= MINE_FUEL_COST;
        } else return "Could not mine, as was not on resource point.";
    }

    // Now, require a dx and dy for remaining actions.
    valid = int_param('dx') && int_param('dy') && (action.dx != 0 || action.dy != 0);
    valid = valid && robot.x + action.dx < this.shadow[0].length && robot.x + action.dx >= 0 && robot.y + action.dy < this.shadow.length && robot.y + action.dy >= 0;
    if (!valid) return "Require a valid, onboard, nonzero dx and dy for given action."

    if (action.action === 'build') {
        if (robot.unit !== PILGRIM && robot.unit !== CASTLE && robot.unit !== CHURCH) return "Only pilgrims, castles and churches can build.";
        if (action.dx > 1 || action.dy > 1) return "Can only build on adjacent squares.";
        if (int_param('build_unit') && action.build_unit >= 0 && action.build_unit <= 5) {
            if (robot.unit === PILGRIM && action.build_unit !== CHURCH) return "Pilgrim failed to build non-church unit.";
            if (robot.unit !== PILGRIM && action.build_unit === CHURCH) return "Non-pilgrim unit failed to build church.";

            if (this.shadow[robot.y+action.dy][robot.x+action.dx] === 0) {
                if (this.karbonite[robot.team] < SPECS[action.build_unit]['CONSTRUCTION_KARBONITE'] || this.fuel[robot.team] < SPECS[action.build_unit]['CONSTRUCTION_FUEL']) return "Cannot afford to build specified unit.";

                this.karbonite[robot.team] -= SPECS[action.build_unit]['CONSTRUCTION_KARBONITE'];
                this.fuel[robot.team] -= SPECS[action.build_unit]['CONSTRUCTION_FUEL'];

                this.createItem(robot.x+action.dx, robot.y+action.dy, robot.team, action.build_unit);
                
            } else return "Attempted to build on occupied tile.";

        } else return "Invalid unit specified to build.";
    }

    else if (action.action === 'give') {
        if (action.dx > 1 || action.dy > 1) return "Can only give to adjacent squares.";
        if (int_param('give_karbonite') && int_param('give_fuel') && action.give_karbonite >= 0 && action.give_fuel >= 0) {
            if (robot.karbonite < action.give_karbonite || robot.fuel < action.give_fuel) return "Tried to give more than you have.";

            var at_shadow = this.shadow[robot.y+action.dy][robot.x+action.dx];
            if (at_shadow === 0) return "Cannot give to empty square.";

            // Either giving to castle/church, or robot.
            at_shadow = this.getItem(at_shadow);

            if (at_shadow.unit === CASTLE || at_shadow.unit === CHURCH) {
                this.karbonite[at_shadow.team] += action.give_karbonite;
                this.fuel[at_shadow.team] += action.give_fuel;
            } else {
                // Cap max transfer at capacity limit of receiver
                action.give_karbonite = Math.min(action.give_karbonite, SPECS[at_shadow.unit]['KARBONITE_CAPACITY'] - at_shadow.karbonite);
                action.give_fuel = Math.min(action.give_fuel, SPECS[at_shadow.unit]['FUEL_CAPACITY'] - at_shadow.fuel);

                at_shadow.karbonite += action.give_karbonite;
                at_shadow.fuel += action.give_fuel;
            }

            robot.karbonite -= action.give_karbonite;
            robot.fuel -= action.give_fuel;

        } else return "Invalid karbonite and fuel to give.";
    }
    
    else if (action.action === 'move') {
        var r = Math.pow(action.dx,2) + Math.pow(action.dy,2);
        if (r > SPECS[robot.unit]['SPEED']) return "Slow down, cowboy.";
        if (this.shadow[robot.y+action.dy][robot.x+action.dx] > 0) return "Cannot move into occupied square.";
        if (this.fuel[robot.team] < r*SPECS[robot.unit]['FUEL_PER_MOVE']) return "Not enough fuel to move.";

        this.fuel[robot.team] -= r*SPECS[robot.unit]['FUEL_PER_MOVE'];
        
        this.shadow[robot.y+action.dy][robot.x+action.dx] = robot.id;
        this.shadow[robot.y][robot.x] = 0;
        robot.y = robot.y+action.dy;
        robot.x = robot.x+action.dx;
    }

    else if (action.action === 'attack') {
        var r = Math.pow(action.dx,2) + Math.pow(action.dy,2);
        if (r > SPECS[robot.unit]['ATTACK_RADIUS'][1] || r < SPECS[robot.unit]['ATTACK_RADIUS'][0]) return "Cannot attack outside of attack range.";
        var at_shadow = this.shadow[robot.y+action.dy][robot.x+action.dx];

        if (at_shadow === 0) return "Cannot attack an empty square.";

        // Handle AOE damage
        for (var r=0; r<this.shadow.length; r++) {
            for (var c=0; c<this.shadow[0].length; c++) {
                var rad = Math.pow(robot.y+action.dy - r,2) + Math.pow(robot.x+action.dx - c,2);
                if (rad <= SPECS[robot.unit]['DAMAGE_SPREAD'] && this.shadow[r][c] !== 0) {
                    var target = this.getItem(this.shadow[r][c]);
                    target.health -= SPECS[robot.unit]['ATTACK_DAMAGE'];
                    
                    if (target.health <= 0) {
                        // Reclaim: attacker gets resources plus half karbonite to construct, divided by rad^2

                        var reclaimed_karb = Math.floor((target.karbonite + SPECS[target.unit]['CONSTRUCTION_KARBONITE']/2)/rad);
                        var reclaimed_fuel = Math.floor(target.fuel/rad);

                        robot.karbonite = Math.min(robot.karbonite+reclaimed_karb, SPECS[robot.unit]['KARBONITE_CAPACITY']);
                        robot.fuel = Math.min(robot.fuel+reclaimed_fuel, SPECS[robot.unit]['FUEL_CAPACITY']);
                        
                        this._deleteRobot(target);
                    }
                }
            }
        }
    }
}


Game.prototype._deleteRobot = function(robot) {
    this.shadow[robot.y][robot.x] = 0;

    if (!robot.initialized) this.init_queue--;

    // delete robot
    var robot_index = this.robots.indexOf(robot);
    this.robots.splice(robot_index, 1);

    if (robot_index < this.robin) this.robin--;
}



module.exports = Game;
