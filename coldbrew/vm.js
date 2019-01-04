var {VM} = require('vm2');

function CrossVM(code) {
    this.vm = new VM({ timeout:100, console: 'off' });
    this.vm.run(code);
}

CrossVM.prototype.turn = function(message) {
    var code = "robot._do_turn(" + message + ");"

    return this.vm.run(code);
}

module.exports = CrossVM;