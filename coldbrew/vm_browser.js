var VM = require('vm');

function CrossVM(code) {
    this.context = VM.createContext();
    this.script = VM.createScript(code);
    this.script.runInContext(this.context); 
}

CrossVM.prototype.turn = function(message) {
    var script = VM.createScript(message);
    return script.runInContext(this.context);
}

module.exports = CrossVM;