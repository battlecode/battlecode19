
class Compiler {

static JS(code) {
return `
class BCAbstractRobot {
    constructor() {
        this.game_state = null;
        this.signal = null;
    }

    _do_turn(game_state) {
        this.game_state = game_state;
        return this.turn();   
    }
    
    signal(value) {
        this.signal = value;
    }

    move(direction) {
        return {'action':'move','dir':direction, 'signal': this.signal};
    }

    turn() {
        return null;
    }
}

${code}

var robot = {'robot':new MyRobot()};
`
}

}

export default Compiler;