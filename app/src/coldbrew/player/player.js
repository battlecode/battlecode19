var bc = {
    NORTH: 0
}

class BCAbstractRobot {
    constructor() {
        this.game_state = null;
    }

    _do_turn(game_state) {
        this.game_state = game_state;
        return this.turn();   
    }

    move() {
        return null;
    }

    turn() {
        return null;
    }
}

//////////////////////////////////

class MyRobot extends BCRobot {
    turn() {
        return this.move(bc.NORTH);
    }
}

/////////////////////////////////

var robot = {'robot':MyRobot()};
/*
function turn() {
    var dir = 0;

    do {
        dir = Math.floor(Math.random()*4);
    } while (bc.inDirection(dir) == null);


    if (bc.inDirection(dir) == 0) {
        return bc.move(dir);
    } else {
        var robot = bc.getRobot(bc.inDirection(dir));
        if (robot.team == bc.me().team) return;
        if (robot.health < bc.me().health*0.4) {
            bc.log("time left: " + bc.timeLeft());
            return bc.split(dir);
        } else {
            return bc.attack(dir);
        }
    }
    return bc.move(bc.DOWN);
}
*/