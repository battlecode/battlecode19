var {VM} = require('vm2');
var sizeof = require('object-sizeof');

var MAX_MEMORY = 10000000; // 10mb

function CrossVM(code) {
    this.vm = new VM({ timeout:100, console: 'off' });
    this.vm.run(code);
    this.dead = false;
}

CrossVM.prototype.turn = function(message) {
	if (this.dead) throw "Robot exceeded memory limits.";

    var code = "robot._do_turn(" + message + ");"

    var action = this.vm.run(code);

    if (sizeof(code) > MAX_MEMORY) {
    	this.vm = null;
    	this.dead = true;
    	throw "Robot exceeded memory limits.";
    }

    return action;
    
}

module.exports = CrossVM;