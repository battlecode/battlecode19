var VM = require('vm');

function CrossVM(code) {
    this.context = VM.createContext();
    this.script = VM.createScript(code);
    this.script.runInContext(this.context); 
}

CrossVM.prototype.turn = function(message) {
    var code = "robot.robot._do_turn(" + message + ");";
    var script = VM.createScript(code);
    return script.runInContext(this.context);
}

module.exports = CrossVM;