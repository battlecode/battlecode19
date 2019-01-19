var SPECS = require('./specs');
var ActionRecord = require('./action_record');
var MersenneTwister = require('mersenne-twister');

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
function Game(seed, chess_initial, chess_extra, debug, create_replay, dont_create_map) {    
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

    this.karbonite = [SPECS.INITIAL_KARBONITE,SPECS.INITIAL_KARBONITE];
    this.fuel      = [SPECS.INITIAL_FUEL, SPECS.INITIAL_FUEL];
    this.last_offer = [[0,0],[0,0]];

    this.generator = new MersenneTwister(this.seed);
    this.random = this.generator.random.bind(this.generator);

    if (create_replay) this.initializeReplay();

    // The shadow is a 2d map where 0 signifies empty and anything
    // else is the id of the robot/item occupying the square.  This is updated
    // after every action.

    if (!dont_create_map) {
        var to_create = this.makeMap(); // list of robots
        for (i=0; i<to_create.length; i++) {
            this.createItem(to_create[i].x, to_create[i].y, to_create[i].team, SPECS.CASTLE);
        }
    }
}

/**
 * Generate a map.
 * 
 * @param {Object[]} to_create - A list of robots to create.
 * @return {Object[]} - A list of robots with x, y, and team.
 */
Game.prototype.makeMap = function() {
    var width = Math.floor(this.random()*33)+32;
    var height = width;

    //Figure out chunk width and height accordingly.
    // Here, we have just two players and are assuming horizontal orientation to start, so this is easy
    var ch = Math.ceil(height/2);
    var cw = width;

    // Determine passability using ideas from 
    // https://gamedevelopment.tutsplus.com/tutorials/generate-random-cave-levels-using-cellular-automata--gamedev-9664
    // Note: It's really sensitive to all three of these parameters.
    var start_alive = this.random()*0.07 + 0.38;
    var birth = 5;
    var death = 4;

    function makemap(contents,w,h) {
        var arr = new Array(h);
        for (var i=0; i<h; i++) {
            arr[i] = new Array(w);
            for (var j=0; j<w; j++) arr[i][j] = contents;
        } return arr;
    }

    var passmap = makemap(null, cw, ch);

    for (var w=0;w<cw;w++) for (var h=0;h<ch;h++) passmap[h][w] = this.random() < start_alive;
    //[[-1,-1],[1,1],[1,0],[0,1],[-1,1],[1,-1],[0,-1],[-1,0]]

    // I hate this so much it hurts
    var countsite = (l, x, y) => [].concat.apply([], [-1,0,1].map(i => [-1,0,1].map(j => [i,j]))).filter(k => k[0] != 0 || k[1] != 0).map(k => 
        +(x+k[0] >= 0 && x+k[0] < cw && y+k[1] >= 0 && y+k[1] < ch && l[y+k[1]][x+k[0]])
    ).reduce((x,y) => x+y);

    for (var i=0; i<2; i++) {
        var newpassmap = makemap(null, cw, ch);
        for (var m=0; m<cw; m++) {
            for (var n=0; n<ch; n++) {
                newpassmap[n][m] = (passmap[n][m] && countsite(passmap, m, n) >= death) || (!passmap[n][m] && countsite(passmap, m, n) >= birth);
            }
        } 
        passmap = newpassmap;
    }

    // Invert the passmap
    for (var m=0; m<cw; m++) {
        for (var n=0; n<ch; n++) {
            passmap[n][m] = !passmap[n][m];
        }
    } 

    // Flood fill to find all of the different sections of the map
    var regions = [];
    var visited = makemap(false, cw, ch);

    for (var n=0; n<ch; n++) {
        for (var m=0; m<cw; m++) {
            if (passmap[n][m] && !visited[n][m]) {
                regions.push([]);
                var stack = [[m,n]]; // Stack-based DFS to flood-fill
                while (stack.length > 0) {
                    var coords = stack.pop();
                    var x = coords[0];
                    var y = coords[1];

                    regions[regions.length-1].push(coords);
                    visited[y][x] = true;

                    if (y > 0 && passmap[y-1][x] && !visited[y-1][x]) stack.push([x, y-1]);
                    if (x > 0 && passmap[y][x-1] && !visited[y][x-1]) stack.push([x-1, y]);
                    if (y < ch-1 && passmap[y+1][x] && !visited[y+1][x]) stack.push([x, y+1]);
                    if (x < cw-1 && passmap[y][x+1] && !visited[y][x+1]) stack.push([x+1, y]);
                }
            }
        }
    }

    regions.sort(x => -1*x.length);
    for (var region=1; region < regions.length; region++) {
        for (var i=0; i<regions[region].length; i++) {
            var coord = regions[region][i];
            passmap[coord[1]][coord[0]] = false;
        }
    }

    // Generate other features: castles, karbonite and fuel depots

    // Select number of castles:
    var num_castles = Math.min(Math.max(Math.floor(2.5*this.random() + ((height+width)/64)-0.5), 1), 3);

    // Choose their locations. We prefer for opposing castles to be far away, so we'll weight the distribution towards the bottom of the map depending on prefer_horizontal and ignore castles which are too close to the midline of the map. Additionally, we want castles on the same team to be at least a certain distance from each other, so we'll re-roll if that's not met.
    var roll_castle = function() {
        var triangle_ch = ch*(ch+1)/2;
        var y = 0;
        while (y<3 || y > ch-8) y = ch - Math.floor(0.5*(Math.sqrt(1+8*this.random()*triangle_ch)-1));
        var x = Math.floor(this.random()*cw);

        return [x,y]
    }.bind(this);

    var castles = [];
    var counter = 0; // This is for the rare case that a solution doesn't actually exist, to ensure that we terminate.
    for (var i=0; i<num_castles; i++) {
        var coord = roll_castle();
        
        // forgive me christ
        while (!passmap[coord[1]][coord[0]] || (castles.length > 0 && Math.min.apply(null, castles.map(c => Math.abs(c[0]-coord[0]) + Math.abs(c[1]-coord[1]))) < 16) && counter < 1000) {
            coord = roll_castle();
            counter += 1;
        }

        if (counter < 1000) castles.push(coord);
    }

    var roll_resource_seed = _ => [Math.floor(this.random()*cw),Math.floor(this.random()*ch)];

    var resource_density = this.random() * (1/200 - 1/400) + 1/400;
    var num_resource_clusters = Math.round(cw*ch*resource_density);

    var resources_cluster_seeds = insulate(castles); // Castles must be seeds of resources
    counter = 0; // This is for the rare case that a solution doesn't actually exist, to ensure that we terminate.
    for (var n=resources_cluster_seeds.length; n<num_resource_clusters; n++) {
        var coord = roll_resource_seed();

        // oops i did it again
        while (!passmap[coord[1]][coord[0]] || Math.min.apply(null, resources_cluster_seeds.map(c => Math.abs(c[0]-coord[0]) + Math.abs(c[1]-coord[1]))) < 12 && counter < 1000) {
            coord = roll_resource_seed();
            counter += 1;
        }
        
        if (counter < 1000) resources_cluster_seeds.push(coord);
    }

    // Now that we have the seed locations for the clusters, we'll roll for how many resources we put in (karbonite and fuel separately)
    // Locations closer to the midline will tend to have more resources, to discourage turtling.
    var karbonite_depots = [];
    var fuel_depots = [];
    visited = makemap(null, cw, ch);

    // helper to check if coordinate is in a list
    function c_in(c, l) {
        for (var i=0; i<l.length; i++) {
            if (l[i][0] === c[0] && l[i][1] === c[1]) return true;
        } return false;
    }

    for (var i=0; i<resources_cluster_seeds.length; i++) {
        var x;
        var y;

        [x,y] = resources_cluster_seeds[i];

        // Choose amount of karbonite and fuel in the cluster.
        var num_karbonite = Math.max(1, Math.round(this.random()*4*(y/ch/2+.5)));
        var num_fuel = Math.max(1, Math.round(this.random()*4*(y/ch/2+.5)));
        var total_depot = num_karbonite + num_fuel;
        
        // We now run a BFS to choose
        var region = [];
        var queue = []; // Queue-based BFS for finding the region:
        queue.push([x,y]);

        for (var z=0; z<5*total_depot; z++) { // Choose an area 5x larger than necessary for the resource cluster.
            if (queue.length === 0) break;

            [x,y] = queue.shift();
            region.push([x,y]);
            visited[y][x] = true;

            if (y > 0 && passmap[y-1][x] && !visited[y-1][x]) queue.push([x, y-1]);
            if (x > 0 && passmap[y][x-1] && !visited[y][x-1]) queue.push([x-1, y]);
            if (y < ch-1 && passmap[y+1][x] && !visited[y+1][x]) queue.push([x, y+1]);
            if (x < cw-1 && passmap[y][x+1] && !visited[y][x+1]) queue.push([x+1, y]);

        }

        // Choose the actual karbonite and fuel locations
        
        counter = 0; // This is for the rare case that a solution doesn't actually exist, to ensure that we terminate.
        for (var k=0; k<num_karbonite; k++) {
            [x,y] = region[Math.floor(this.random()*region.length)];
            
            while ((c_in([x,y], castles) || c_in([x,y], karbonite_depots) || c_in([x,y], fuel_depots)) && counter < 10000) {
                [x,y] = region[Math.floor(this.random()*region.length)];
                counter++;
            }

            if (counter < 10000) karbonite_depots.push([x,y]);
        }
        counter = 0; // This is for the rare case that a solution doesn't actually exist, to ensure that we terminate.
        for (var k=0; k<num_fuel; k++) {
            [x,y] = region[Math.floor(this.random()*region.length)];
            
            while ((c_in([x,y], castles) || c_in([x,y], karbonite_depots) || c_in([x,y], fuel_depots)) && counter < 10000) {
                [x,y] = region[Math.floor(this.random()*region.length)];
                counter++;
            }

            if (counter < 10000) fuel_depots.push([x,y]);
        }


    }
    
    // Convert lists into bool maps
    var karb_map = makemap(false, cw, ch);

    var fuel_map = makemap(false, cw, ch);

    for (var i=0; i<karbonite_depots.length; i++) {
        karb_map[karbonite_depots[i][1]][karbonite_depots[i][0]] = true;
    }

    for (var i=0; i<fuel_depots.length; i++) {
        fuel_map[fuel_depots[i][1]][fuel_depots[i][0]] = true;
    }

    // mirror the map
    var full_passmap = makemap(false, width, height);

    var full_karbmap = makemap(false, width, height);

    var full_fuelmap = makemap(false, width, height);

    var transpose = this.random() < 0.5;
    for (var n=0; n<height; n++) {
        for (var m=0; m<width; m++) {
            full_passmap[transpose?m:n][transpose?n:m] = n<ch ? passmap[n][m] : passmap[height-n-1][m];
            full_fuelmap[transpose?m:n][transpose?n:m] = n<ch ? fuel_map[n][m] : fuel_map[height-n-1][m];
            full_karbmap[transpose?m:n][transpose?n:m] = n<ch ? karb_map[n][m] : karb_map[height-n-1][m];
        }
    }

    var all_castles = castles.concat(castles.map(c => [c[0], height-c[1]-1]));
    if (transpose) all_castles = all_castles.map(c => [c[1],c[0]]);


    this.shadow = makemap(0, width, height);

    this.karbonite_map = full_karbmap;
    this.fuel_map = full_fuelmap;
    this.map = full_passmap;

    var to_create = [];

    for (var i=0; i<all_castles.length/2; i++) {
        to_create.push({
            team:0, 
            x:all_castles[i][0], 
            y:all_castles[i][1]
        });

        to_create.push({
            team:1, 
            x:all_castles[(all_castles.length/2) + i][0], 
            y:all_castles[(all_castles.length/2) + i][1]
        });
    }

    return to_create;
}

/**
 * Return a copy of a game at a given point.
 * 
 * @return {Game} - A deep copy of the current game that will remain constant.
 */
Game.prototype.copy = function() {
    var m = insulate(this.generator);

    var g = new Game(this.seed, this.chess_initial, this.chess_extra, false, false, true);
    g.replay = this.replay ? insulate(this.replay) : undefined;
    g.map = insulate(this.map);
    g.karbonite_map = insulate(this.karbonite_map);
    g.fuel_map = insulate(this.fuel_map);

    g.shadow = insulate(this.shadow);
    g.robots = insulate(this.robots);
    g.ids = insulate(this.ids);

    g.round = this.round;
    g.robin = this.robin;
    g.init_queue = this.init_queue;
    g.winner = this.winner;
    g.win_condition = g.win_condition;

    g.logs = insulate(this.logs);
    g.karbonite = insulate(this.karbonite);
    g.fuel = insulate(this.fuel);
    g.last_offer = insulate(this.last_offer);

    // Copy MersenneTwister. Thanks @hgarrereyn!
    g.generator = new MersenneTwister();
    var keys = Object.keys(m);
    for (var i = 0; i < keys.length; ++i) {
        g.generator[keys[i]] = m[keys[i]];
    }

    g.random = g.generator.random.bind(g.generator);

    return g;
}

Game.prototype.initializeReplay = function() {
    // The BC19 replay format is an intriguing one.
    // Byte 0: reserved for winner.
    // Byte 1: reserved for win reason.
    // Bytes 2-5: 32 bit map seed
    //
    // After that, we just have a lot of 8 byte robot actions.

    this.replay = [0,0];

    this.replay.push(this.seed >> 24);
    this.replay.push((this.seed >> 16) % Math.pow(2,8));
    this.replay.push((this.seed >> 8) % Math.pow(2,8));
    this.replay.push(this.seed % Math.pow(2,8));
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

    do id = 1+Math.floor((SPECS.MAX_ID-1) * this.random());
    while (this.ids.indexOf(id) >= 0);
    this.ids.push(id);

    var robot         = {'type':'robot'};
    robot.id          = id;
    robot.team        = team; // 0 is red, 1 is blue
    robot.x           = x;    // (0,0) should be top left
    robot.y           = y;
    robot.unit        = unit;

    robot.health      = SPECS.UNITS[unit]['STARTING_HP'];
    robot.karbonite   = 0;
    robot.fuel        = 0;    // current holding
    robot.turn        = 0;

    robot.signal      = 0;    // SPECS.COMMUNICATION_BITS max
    robot.signal_radius = 0;  // r^2
    robot.castle_talk = 0;    // talk to god

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
    if (message.stack) message = message.stack;
    
    if (this.debug) {
        var team = robot.team===0?"red":"blue";
        if (inBrowser()) console.log("%c"+"[Robot "+robot.id+" Error] "
                                   + ("%c"+message),"color:"+team+";",
                                     "color:black;");
        else console.log((robot.team==0?"\033[31m":"\033[34m") + "[Robot "+robot.id+" Error]\033[0m " + message);
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
        else console.log((robot.team==0?"\033[31m":"\033[34m") + "[Robot "+robot.id+" Log]\033[0m " + message)
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

                if (robot.unit === SPECS.CASTLE) castles[robot.team]++;
            } else nulls[robot.team]++;
        }
    }

    if (total[0] === 0) nulls[0] = -1;
    if (total[1] === 0) nulls[1] = -1;

    if (nulls[0] === total[0] && nulls[1] === total[1]) {
        this.winner = +(this.random() > 0.5);
        this.win_condition = 4;
        if (this.debug) console.log("Both teams failed to initialize.");
    } else if (nulls[0] === total[0]) {
        this.winner = 1;
        this.win_condition = 3;
        if (this.debug) console.log("Red failed to initialize.");
    } else if (nulls[1] === total[1]) {
        this.winner = 0;
        this.win_condition = 3;
        if (this.debug) console.log("Blue failed to initialize.");
    } else if (castles[0] === 0 && castles[1] !== 0) {
        this.winner = 1;
        this.win_condition = 0;
        if (this.debug) console.log("Game over, blue won by castle annihilation.");
    } else if (castles[0] !== 0 && castles[1] === 0) {
        this.winner = 0;
        this.win_condition = 0;
        if (this.debug) console.log("Game over, red won by castle annihilation.");
    } else if (castles[0] === 0 && castles[1] === 0) {
        this.win_condition = 2;
        this.winner = +(this.random() > 0.5);
        if (this.debug) console.log("Game over, " + (this.winner===0?"red":"blue") + " won by random draw each with no castles.");
    } else if (this.round >= SPECS.MAX_ROUNDS) {
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
                this.winner = +(this.random() > 0.5);
                if (this.debug) console.log("Game over, " + (this.winner===0?"red":"blue") + " won by random draw.");
            } this.win_condition = 1;
        }
    }

    if (this.replay && this.win_condition !== undefined) {
        this.replay[0] = this.winner;
        this.replay[1] = this.win_condition;
    }

    return this.win_condition !== undefined;
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
    for (var i=0; i<this.shadow.length; i++) view[i]=Array(this.shadow[0].length).fill(-1);
    
    for (var r=0; r<this.shadow.length; r++) {
        for (var c=0; c<this.shadow[0].length; c++) {
            if (Math.pow(robot.x - c,2) + Math.pow(robot.y - r,2) <= SPECS.UNITS[robot.unit]['VISION_RADIUS']) {
                view[r][c] = this.shadow[r][c];
            }
        }
    }

    return view;
}


Game.prototype.getGameStateDump = function(robot) {
    var visible_robots = [];
    var shadow = this.getVisible(robot);

    var is_castle = robot.unit === SPECS.CASTLE;
    for (var i=0; i<this.robots.length; i++) {
        var d = Math.pow(robot.x - this.robots[i].x,2) + Math.pow(robot.y - this.robots[i].y,2);
        var visible = d <= SPECS.UNITS[robot.unit]['VISION_RADIUS'];
        var radioable = d <= this.robots[i].signal_radius;

        if (!visible && !radioable && !is_castle) continue;

        var r = insulate(this.robots[i]);

        // Castle talk should only work for same team
        if (!visible && !radioable && robot.team !== r.team) continue;
        
        delete r.initialized;
        delete r.hook;
        delete r.start_time;
        delete r.doing;

        if (robot.id !== r.id) {
            delete r.health;
            delete r.karbonite;
            delete r.fuel;
            delete r.time;
        }

        if (!radioable) {
            r.signal = -1;
            r.signal_radius = -1;
        }

        if (!visible) delete r.unit;

        if (!visible && !radioable) {
            delete r.x;
            delete r.y;
        }

        if (!is_castle && !visible) delete r.team;

        if (!is_castle || robot.team !== this.robots[i].team) delete r.castle_talk;

        visible_robots.push(r);

    }

    // Shuffle visible_robots in place
    for (var i = visible_robots.length - 1; i > 0; i--) {
        var j = Math.floor(this.random() * (i + 1));
        var x = visible_robots[i];
        visible_robots[i] = visible_robots[j];
        visible_robots[j] = x;
    }

    return 'robot._do_turn(' + JSON.stringify({
        id: robot.id, 
        shadow:shadow, 
        visible:visible_robots, 
        map:robot.turn===1?this.map:[[0],[0]], 
        karbonite_map:robot.turn===1?this.karbonite_map:[[0],[0]], 
        fuel_map:robot.turn===1?this.fuel_map:[[0],[0]],
        fuel:this.fuel[robot.team],
        karbonite:this.karbonite[robot.team],
        last_offer:(robot.unit === SPECS.CASTLE ? this.last_offer:null)
    }) + ');';
    
}

/**
 * Enact a turn for the next robot using its hook.
 *
 * Returns empty string if nothing went wrong.  If the move
 * is bad, return a string with the error message.
 *
 * @return {String} An error message or empty string.
 */
Game.prototype.enactTurn = function(record) {
    if (this.robin >= this.robots.length) {
        this.robin = 0;
        this.round++;

        this.fuel[0] += SPECS.TRICKLE_FUEL;
        this.fuel[1] += SPECS.TRICKLE_FUEL;      
    }

    var robot = this.robots[this.robin];
    robot.turn++;

    if (!record) {
        robot.time += this.chess_extra;
        var dump = this.getGameStateDump(robot);

        var action = null;

        robot.start_time = wallClock();

        if (robot.time > 0) {
            try { action = robot.hook(dump); }
            catch (e) { this.robotError(e, robot); }
        }

        var diff_time = wallClock() - robot.start_time;

        //action = insulate(action);

        record = new ActionRecord(this, robot);

        try {
            this.processAction(robot, action, diff_time, record);
        } catch(e) { this.robotError(e, robot); }

    } else record = ActionRecord.FromBytes(record);

    try {
        record.enact(this, robot);
    } catch (e) { this.robotError(e, robot); }

    if (this.replay) this.replay.push.apply(this.replay, record.serialize());
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

Game.prototype.processAction = function(robot, action, time, record) {
    robot.time -= time;
    if (robot.time < 0 || robot.hook === null || !robot.initialized) {
        throw "Robot is frozen due to clock overdrawn by " + (-1*robot.time) + "ms.";
    }

    function int_param(param) {
        return param in action && action[param] !== null && Number.isInteger(action[param]);
    }

    if (action === null) return;

    var valid = typeof action==='object' && action!==null && !(action instanceof Array) && !(action instanceof Date);
    if (!valid) throw "Malformed move.";

    if ('logs' in action && 'length' in action['logs']) {
        for (var l=0; l<action['logs'].length; l++) {
            if (typeof action['logs'][l] === "string") this.robotLog(action['logs'][l], robot);
            else if (Object.prototype.toString.call(action['logs'][l]) === "[object String]") this.robotLog(action['logs'][l].valueOf(), robot);
            else throw "Can only log strings.";
        }
    }

    if ('error' in action && (typeof action['error'] === 'string' || action['error'] instanceof String)) {
        this.robotError(action.error, robot);
    }

    var temp_fuel = this.fuel[robot.team];
    if ('signal' in action) {
        if (int_param('signal') && int_param('signal_radius') && action.signal >= 0 && action.signal < Math.pow(2,SPECS.COMMUNICATION_BITS) && action.signal_radius >= 0 && action.signal_radius <= 2*Math.pow(SPECS.MAX_BOARD_SIZE-1,2)) {
            var fuel_cost = Math.ceil(Math.sqrt(action.signal_radius));

            if (this.fuel[robot.team] >= fuel_cost) {
                temp_fuel -= fuel_cost;
                record.signal = action.signal;
                record.signal_radius = action.signal_radius;
            } else throw "Insufficient fuel to signal given radius.";

        } else throw "Invalid signal message.";
    }

    if ('castle_talk' in action) {
        if (int_param('castle_talk') && action.castle_talk >= 0 && action.castle_talk < Math.pow(2,SPECS.CASTLE_TALK_BITS)) {
            record.castle_talk = action.castle_talk;
        } else throw "Invalid castle talk."
    }

    if (!('action' in action)) return;

    valid = ['move','attack','build','mine','trade','give'].indexOf(action['action']) >= 0;
    if (!valid) throw "Action must be move, attack, build, mine, trade, or give.";

    if (action.action === 'trade') {
        if (robot.unit !== SPECS.CASTLE) throw "Only Castles can trade.";

        if (int_param('trade_fuel') && int_param('trade_karbonite') && Math.abs(action.trade_fuel) < SPECS.MAX_TRADE && Math.abs(action.trade_karbonite) < SPECS.MAX_TRADE) {
            // trade_fuel and trade_karbonite are the amount given by red, or received by blue.
            // for example, for red to offer a trade of 10 karbonite for 10 fuel, it would be karbonite=10 and fuel=-10.
            record.trade(action.trade_karbonite, action.trade_fuel);
        } else throw "Must provide valid fuel and karbonite offers.";

        return;
    }

    else if (action.action === 'mine') {
        if (robot.unit !== SPECS.PILGRIM) throw "Only Pilgrims can mine.";
        if (temp_fuel - SPECS.MINE_FUEL_COST < 0) throw "Not enough fuel to mine.";

        record.mine();

        return;
    }

    // Now, require a dx and dy for remaining actions.
    valid = int_param('dx') && int_param('dy') && (action.dx != 0 || action.dy != 0) && Math.abs(action.dx) < SPECS.MAX_BOARD_SIZE && Math.abs(action.dy) < SPECS.MAX_BOARD_SIZE; 
    valid = valid && robot.x + action.dx < this.shadow[0].length && robot.x + action.dx >= 0 && robot.y + action.dy < this.shadow.length && robot.y + action.dy >= 0;
    if (!valid) throw "Require a valid, onboard, nonzero dx and dy for given action."

    if (action.action === 'build') {
        if (!this.map[robot.y + action.dy][robot.x + action.dx]) throw "Cannot build on impassable tile.";
        if (robot.unit !== SPECS.PILGRIM && robot.unit !== SPECS.CASTLE && robot.unit !== SPECS.CHURCH) throw "Only pilgrims, castles and churches can build.";
        if (Math.abs(action.dx) > 1 || Math.abs(action.dy) > 1) throw "Can only build on adjacent squares.";
        if (int_param('build_unit') && action.build_unit >= 0 && action.build_unit <= 5) {
            if (robot.unit === SPECS.PILGRIM && action.build_unit !== SPECS.CHURCH) throw "Pilgrim failed to build non-church unit.";
            if (robot.unit !== SPECS.PILGRIM && action.build_unit === SPECS.CHURCH) throw "Non-pilgrim unit failed to build church.";
            if (action.build_unit === SPECS.CASTLE) throw "Cannot build castles.";

            if (this.shadow[robot.y+action.dy][robot.x+action.dx] === 0) {
                if (this.karbonite[robot.team] < SPECS.UNITS[action.build_unit]['CONSTRUCTION_KARBONITE'] || temp_fuel < SPECS.UNITS[action.build_unit]['CONSTRUCTION_FUEL']) throw "Cannot afford to build specified unit.";

                record.build(action.dx, action.dy, action.build_unit);
                
            } else throw "Attempted to build on occupied tile.";

        } else throw "Invalid unit specified to build.";
    }

    else if (action.action === 'give') {
        if (!this.map[robot.y + action.dy][robot.x + action.dx]) throw "Cannot give to impassable tile.";
        if (Math.abs(action.dx) > 1 || Math.abs(action.dy) > 1) throw "Can only give to adjacent squares.";
        if (int_param('give_karbonite') && int_param('give_fuel') && action.give_karbonite >= 0 && action.give_fuel >= 0 && action.give_fuel < Math.pow(2,8) && action.give_karbonite < Math.pow(2,8)) {
            if (robot.karbonite < action.give_karbonite || robot.fuel < action.give_fuel) throw "Tried to give more than you have.";

            record.give(action.dx, action.dy, action.give_karbonite, action.give_fuel);

        } else throw "Invalid karbonite and fuel to give.";
    }
    
    else if (action.action === 'move') {
        if (!this.map[robot.y + action.dy][robot.x + action.dx]) throw "Cannot move to impassable tile.";
        var r = Math.pow(action.dx,2) + Math.pow(action.dy,2);
        if (r > SPECS.UNITS[robot.unit]['SPEED']) throw "Slow down, cowboy.  Tried to move faster than unit can.";
        if (this.shadow[robot.y+action.dy][robot.x+action.dx] > 0) throw "Cannot move into occupied square.";
        if (temp_fuel < r*SPECS.UNITS[robot.unit]['FUEL_PER_MOVE']) throw "Not enough fuel to move at given speed.";

        record.move(action.dx, action.dy);
    }

    else if (action.action === 'attack') {
        var r = Math.pow(action.dx,2) + Math.pow(action.dy,2);
        if (r > SPECS.UNITS[robot.unit]['ATTACK_RADIUS'][1] || r < SPECS.UNITS[robot.unit]['ATTACK_RADIUS'][0]) throw "Cannot attack outside of attack range.";

        if (temp_fuel < SPECS.UNITS[robot.unit]['ATTACK_FUEL_COST']) throw "Not enough fuel to attack.";        

        record.attack(action.dx, action.dy);
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
