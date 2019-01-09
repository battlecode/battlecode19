import {BCAbstractRobot, SPECS} from 'battlecode';

var step = -1;

class MyRobot extends BCAbstractRobot {
    turn() {
        step++;

        if (this.me.unit === SPECS.CRUSADER) {
            // this.log("Crusader health: " + this.me.health);
            this.log("CRUSADER");
            const choices = [[0,-1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
            const choice = choices[Math.floor(Math.random()*choices.length)];
            return this.move(...choice);
        }

        else if (this.me.unit === SPECS.CASTLE) {
            this.log("CASTLE");
            if (step % 10 === 0) {
                //this.log("Building a crusader at " + (this.me.x+1) + ", " + (this.me.y+1));
                if (this.me.team == 1) return this.buildUnit(SPECS.CRUSADER, 1, 1);
            } else {
                return // this.log("Castle health: " + this.me.health);
            }
        }

    }
}

var robot = new MyRobot();