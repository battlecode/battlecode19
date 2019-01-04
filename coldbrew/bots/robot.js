import {BCAbstractRobot, SPECS} from 'battlecode';

var built = false;
var step = -1;

class MyRobot extends BCAbstractRobot {
    turn() {
        step++;

        if (this.me.unit === SPECS.CRUSADER && this.me.team === SPECS.RED) {
            this.log("Preacher health: " + this.me.health);
            return this.attack(-1,-1);
        }

        else if (this.me.unit === SPECS.CASTLE) {
            if (step === 0) {
                this.log("Building a crusader at " + (this.me.x+1) + ", " + (this.me.y+1));
                return this.buildUnit(SPECS.CRUSADER, 1, 1);
            } else this.log("Castle health: " + this.me.health);
        }

    }
}

var robot = new MyRobot();