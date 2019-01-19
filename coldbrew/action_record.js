var SPECS = require('./specs');

function ActionRecord() {
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

ActionRecord.prototype.isEqual = function(that) {
    return this.signal === that.signal && 
           this.signal_radius === that.signal_radius && 
           this.castle_talk === that.castle_talk &&
           this.action === that.action &&
           this.trade_fuel === that.trade_fuel &&
           this.trade_karbonite === that.trade_karbonite &&
           this.dx === that.dx &&
           this.dy === that.dy &&
           this.give_karbonite === that.give_karbonite &&
           this.give_fuel === that.give_fuel &&
           this.build_unit === that.build_unit;
} 

ActionRecord.prototype.serialize = function() {
    // Behold, the serialization format for ActionRecords.
    //
    //  16: signal
    //  15: radius
    //  8: castle_talk
    //  3: action (NOTHING, MOVE, ATTACK, BUILD, MINE, TRADE, GIVE, TIMEOUT)
    //  
    //  if trade:
    //    11: trade_fuel (sign and mag)
    //    11: trade_karbonite (sign and mag)
    //  
    //  if mine:
    //    ignore
    //  
    //  if move/attack:
    //    6: padding
    //    8: dx (sign and mag)
    //    8: dy (sign and mag)
    //  
    //  if give:
    //    3: dx (sign and mag)
    //    3: dy (sign and mag)
    //    8: give_karb
    //    8: give_fuel
    //  
    //  if build:
    //    3: dx (sign and mag)
    //    3: dy (sign and mag)
    //    5: padding
    //    3: unit type
    // 
    //  total: 8 bytes of goodness

    var s = new Uint8Array(8);
    
    s[0] = this.signal >> 8;
    s[1] = this.signal % Math.pow(2,8);

    s[2] = this.signal_radius >> 7;
    s[3] = (this.signal_radius % Math.pow(2,7)) << 1;
    s[3] += this.castle_talk >> 7;

    s[4] = (this.castle_talk % Math.pow(2,7)) << 1;
    s[4] += this.action >> 2;

    s[5] = (this.action % Math.pow(2,2)) << 6;

    if (this.action === 5) { // Trade
        var trade_fuel = Math.abs(this.trade_fuel) + (this.trade_fuel < 0 ? (1 << 10) : 0);
        var trade_karbonite = Math.abs(this.trade_karbonite) + (this.trade_karbonite < 0 ? (1 << 10) : 0);
        s[5] += trade_fuel >> 5;
        s[6] = (trade_fuel % Math.pow(2,5)) << 3;
        s[6] += trade_karbonite >> 8;
        s[7] = trade_karbonite % Math.pow(2,8);
    }

    else if (this.action === 1 || this.action === 2) { // move or attack
        s[6] = Math.abs(this.dx);
        s[7] = Math.abs(this.dy);

        if (this.dx < 0) s[6] += 1 << 7;
        if (this.dy < 0) s[7] += 1 << 7;
    }

    else if (this.action === 3 || this.action === 6) { // build or give
        var dx = Math.abs(this.dx) + (this.dx < 0 ? (1 << 2) : 0);
        var dy = Math.abs(this.dy) + (this.dy < 0 ? (1 << 2) : 0);
        
        s[5] += (dx << 3) + dy;

        if (this.action === 3) { // build
            s[6] = this.build_unit;
        } else { // give
            s[6] = this.give_karbonite;
            s[7] = this.give_fuel;
        }
    }

    return s;


}

ActionRecord.FromBytes = function(s) { // deserialize
    var x = new ActionRecord();
    
    x.signal = (s[0] << 8) + s[1];

    x.signal_radius = s[2] << 7;
    x.signal_radius += s[3] >> 1;

    x.castle_talk = (s[3] % 2) << 7;
    x.castle_talk += s[4] >> 1;

    x.action = (s[4] % 2) << 2;
    x.action += s[5] >> 6;
    if (x.action === 5) {
        x.trade_fuel = (s[5] % Math.pow(2,6)) << 5;
        x.trade_fuel += s[6] >> 3;
        x.trade_karbonite = (s[6] % Math.pow(2,3)) << 8;
        x.trade_karbonite += s[7];
        if (x.trade_fuel >= (1 << 10)) x.trade_fuel = -(x.trade_fuel - (1 << 10));
        if (x.trade_karbonite >= (1 << 10)) x.trade_karbonite = -(x.trade_karbonite - (1 << 10));
    }
    
    else if (x.action === 1 || x.action === 2) {
        x.dx = (s[6] >> 7 === 1 ? -1 : 1) * (s[6] % Math.pow(2,7));
        x.dy = (s[7] >> 7 === 1 ? -1 : 1) * (s[7] % Math.pow(2,7));
    }

    else if (x.action === 3 || x.action === 6) {
        x.dy = s[5] % Math.pow(2,3);
        x.dx = (s[5] >> 3) % Math.pow(2,3);

        x.dy = (1-2*(x.dy >> 2)) * (x.dy % Math.pow(2,2));
        x.dx = (1-2*(x.dx >> 2)) * (x.dx % Math.pow(2,2));

        if (x.action === 3) { // build
            x.build_unit = s[6];
        } else { // give
            x.give_karbonite = s[6];
            x.give_fuel = s[7];
        }
    }

    return x;
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
    this.game.fuel[this.robot.team] -= r*SPECS.UNITS[this.robot.unit]['FUEL_PER_MOVE'];
    
    this.game.shadow[this.robot.y+this.dy][this.robot.x+this.dx] = this.robot.id;
    this.game.shadow[this.robot.y][this.robot.x] = 0;
    this.robot.y = this.robot.y+this.dy;
    this.robot.x = this.robot.x+this.dx;
}

ActionRecord.prototype.enactAttack = function() {
    this.game.fuel[this.robot.team] -= SPECS.UNITS[this.robot.unit]['ATTACK_FUEL_COST'];

    // Handle AOE damage
    for (var r=0; r<this.game.shadow.length; r++) {
        for (var c=0; c<this.game.shadow[0].length; c++) {
            var rad = Math.pow(this.robot.y+this.dy - r,2) + Math.pow(this.robot.x+this.dx - c,2);
            var rad_to_attacker = Math.pow(this.robot.y - r,2) + Math.pow(this.robot.x - c,2);
            if (rad <= SPECS.UNITS[this.robot.unit]['DAMAGE_SPREAD'] && this.game.shadow[r][c] !== 0) {
                var target = this.game.getItem(this.game.shadow[r][c]);
                target.health -= SPECS.UNITS[this.robot.unit]['ATTACK_DAMAGE'];
                
                if (target.health <= 0) {
                    // Reclaim: attacker gets resources plus half karbonite to construct, divided by rad^2

                    if (target.unit !== SPECS.CASTLE && target.unit !== SPECS.CHURCH) {
                        var reclaimed_karb = Math.floor((target.karbonite + SPECS.UNITS[target.unit]['CONSTRUCTION_KARBONITE']/2)/rad_to_attacker);
                        var reclaimed_fuel = Math.floor(target.fuel/rad_to_attacker);

                        this.robot.karbonite = Math.min(this.robot.karbonite+reclaimed_karb, SPECS.UNITS[this.robot.unit]['KARBONITE_CAPACITY']);
                        this.robot.fuel = Math.min(this.robot.fuel+reclaimed_fuel, SPECS.UNITS[this.robot.unit]['FUEL_CAPACITY']);
                    }
                    
                    this.game._deleteRobot(target);
                }
            }
        }
    }
}

ActionRecord.prototype.enact = function(game, robot) {
    this.game = game;
    this.robot = robot;

    this.game.robin++;

    this.robot.signal = this.signal;
    this.robot.signal_radius = this.signal_radius;
    this.robot.castle_talk = this.castle_talk;
    
    this.game.fuel[this.robot.team] -= Math.ceil(Math.sqrt(this.signal_radius));

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
