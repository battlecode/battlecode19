var SPECS = require('./specs');

function ActionRecord(game, robot) {
    this.robot = robot;
    this.game  = game;

    this.signal = 0;
    this.signal_radius = 0;
    this.castle_talk = 0;
    this.action = 0; // NOTHING, MOVE, ATTACK, BUILD, MINE, TRADE, GIVE, TIMEOUT

    this.trade_fuel = null;
    this.trade_karbonite = null;

    this.dx = null;
    this.dy = null;

    this.give_karbonite = null;
    this.give_fuel = null;

    this.build_unit = null;
}

ActionRecord.prototype.serialize = function() {

}

ActionRecord.prototype.FromBlob = function(blob) {

}

ActionRecord.prototype.timeout = function() {
    this.action = 7;
}

ActionRecord.prototype.trade = function(karbonite, fuel) {
    this.action = 5;
    this.trade_karbonite = karbonite;
    this.trade_fuel = fuel;
}

ActionRecord.prototype.mine = function() {
    this.action = 4;
}

ActionRecord.prototype.build = function(dx, dy, unit) {
    this.action = 3;
    this.dx = dx;
    this.dy = dy;
    this.build_unit = unit;
}

ActionRecord.prototype.give = function(dx, dy, give_karbonite, give_fuel) {
    this.action = 6;
    this.dx = dx;
    this.dy = dy;
    this.give_karbonite = give_karbonite;
    this.give_fuel = give_fuel;
}

ActionRecord.prototype.move = function(dx, dy) {
    this.action = 1;
    this.dx = dx;
    this.dy = dy;
}

ActionRecord.prototype.attack = function(dx, dy) {
    this.action = 2;
    this.dx = dx;
    this.dy = dy;
}

ActionRecord.prototype.enactTimeout = function() {
    this.game.robots.splice(this.game.robots.indexOf(this.robot), 1);
    this.game.robin--;
    this.game.shadow[this.robot.y][this.robot.x] = 0;

    throw "Timed out by " + this.robot.time*-1 + "ms.";
}

ActionRecord.prototype.enactMine = function() {
    if (this.game.karbonite_map[this.robot.y][this.robot.x]) {
        this.robot.karbonite = Math.min(this.robot.karbonite + SPECS.KARBONITE_YIELD, SPECS.UNITS[SPECS.PILGRIM]['KARBONITE_CAPACITY']);
        this.game.fuel[this.robot.team] -= SPECS.MINE_FUEL_COST;
    }
    
    else if (this.game.fuel_map[this.robot.y][this.robot.x]) {
        this.robot.fuel = Math.min(this.robot.fuel + SPECS.FUEL_YIELD, SPECS.UNITS[SPECS.PILGRIM]['FUEL_CAPACITY']);
        this.game.fuel[this.robot.team] -= SPECS.MINE_FUEL_COST;
    }

    else throw "Could not mine, as was not on resource point.";
}


ActionRecord.prototype.enactTrade = function() {
    this.game.last_offer[this.robot.team] = [this.trade_karbonite, this.trade_fuel];
            
    // if the most recent blue offer is equal to the most recent red offer, the deal is enacted if payable, and nullified if not.
    if (this.game.last_offer[0][0] === this.game.last_offer[1][0] && this.game.last_offer[0][1] === this.game.last_offer[1][1]) {
        this.game.last_offer = [[0,0],[0,0]];

        // Check if deal is payable
        if (this.game.karbonite[0] >= this.trade_karbonite && this.game.karbonite[1] >= -1*this.trade_karbonite &&
            this.game.fuel[0] >= this.trade_fuel && this.game.fuel[1] >= -1*this.trade_fuel) {

            // Enact the deal
            this.game.karbonite[0] -= this.trade_karbonite;
            this.game.karbonite[1] += this.trade_karbonite;
            this.game.fuel[0] -= this.trade_fuel;
            this.game.fuel[1] += this.trade_fuel;

        } else throw "Agreed trade deal is not payable.";
    }
}

ActionRecord.prototype.enactBuild = function() {
    console.log("building " + this.build_unit)
    this.game.karbonite[this.robot.team] -= SPECS.UNITS[this.build_unit]['CONSTRUCTION_KARBONITE'];
    this.game.fuel[this.robot.team] -= SPECS.UNITS[this.build_unit]['CONSTRUCTION_FUEL'];

    this.game.createItem(this.robot.x+this.dx, this.robot.y+this.dy, this.robot.team, this.build_unit);
}

ActionRecord.prototype.enactGive = function() {
    var at_shadow = this.game.shadow[this.robot.y+this.dy][this.robot.x+this.dx];
    if (at_shadow === 0) throw "Cannot give to empty square.";

    // Either giving to castle/church, or robot.
    at_shadow = this.game.getItem(at_shadow);

    if (at_shadow.unit === SPECS.CASTLE || at_shadow.unit === SPECS.CHURCH) {
        this.game.karbonite[at_shadow.team] += this.give_karbonite;
        this.game.fuel[at_shadow.team] += this.give_fuel;
    } else {
        // Cap max transfer at capacity limit of receiver
        this.give_karbonite = Math.min(this.give_karbonite, SPECS.UNITS[at_shadow.unit]['KARBONITE_CAPACITY'] - at_shadow.karbonite);
        this.give_fuel = Math.min(this.give_fuel, SPECS.UNITS[at_shadow.unit]['FUEL_CAPACITY'] - at_shadow.fuel);

        at_shadow.karbonite += this.give_karbonite;
        at_shadow.fuel += this.give_fuel;
    }

    this.robot.karbonite -= this.give_karbonite;
    this.robot.fuel -= this.give_fuel;    
}

ActionRecord.prototype.enactMove = function() {
    var r = (Math.pow(this.dx,2) + Math.pow(this.dy,2));
    this.game.fuel[this.robot.team] -= r*SPECS.UNITS[robot.unit]['FUEL_PER_MOVE'];
    
    this.game.shadow[this.robot.y+this.dy][this.robot.x+this.dx] = this.robot.id;
    this.game.shadow[this.robot.y][this.robot.x] = 0;
    this.robot.y = this.robot.y+this.dy;
    this.robot.x = this.robot.x+this.dx;
}

ActionRecord.prototype.enactAttack = function() {
    // Handle AOE damage
    for (var r=0; r<this.game.shadow.length; r++) {
        for (var c=0; c<this.game.shadow[0].length; c++) {
            var rad = Math.pow(this.robot.y+this.dy - r,2) + Math.pow(this.robot.x+this.dx - c,2);
            if (rad <= SPECS.UNITS[this.robot.unit]['DAMAGE_SPREAD'] && this.game.shadow[r][c] !== 0) {
                var target = this.game.getItem(this.game.shadow[r][c]);
                target.health -= SPECS.UNITS[this.robot.unit]['ATTACK_DAMAGE'];
                
                if (target.health <= 0) {
                    // Reclaim: attacker gets resources plus half karbonite to construct, divided by rad^2

                    var reclaimed_karb = Math.floor((target.karbonite + SPECS.UNITS[target.unit]['CONSTRUCTION_KARBONITE']/2)/rad);
                    var reclaimed_fuel = Math.floor(target.fuel/rad);

                    this.robot.karbonite = Math.min(this.robot.karbonite+reclaimed_karb, SPECS.UNITS[this.robot.unit]['KARBONITE_CAPACITY']);
                    this.robot.fuel = Math.min(this.robot.fuel+reclaimed_fuel, SPECS.UNITS[this.robot.unit]['FUEL_CAPACITY']);
                    
                    this.game._deleteRobot(target);
                }
            }
        }
    }
}

ActionRecord.prototype.enact = function() {
    this.game.robin++;
    if (this.game.robin === this.game.robots.length) this.game.robin++;

    this.robot.signal = this.signal;
    this.robot.signal_radius = this.signal_radius;
    this.robot.church_talk = this.church_talk;

    // NOTHING, MOVE, ATTACK, BUILD, MINE, TRADE, GIVE, TIMEOUT
    if      (this.action === 1) this.enactMove();
    else if (this.action === 2) this.enactAttack();
    else if (this.action === 3) this.enactBuild();
    else if (this.action === 4) this.enactMine();
    else if (this.action === 5) this.enactTrade();
    else if (this.action === 6) this.enactGive();
    else if (this.action === 7) this.enactTimeout();
}


module.exports = ActionRecord;