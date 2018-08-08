prefix = """
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
"""

postfix = """
var robot = {'robot':MyRobot()};
"""

def compile(source):
	new_source = prefix + source + postfix

	return {'success':True, 'error':"", 'js':new_source, 'map':None}
