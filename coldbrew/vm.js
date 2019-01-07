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

    var action = this.vm.run(message);

    if (sizeof(this.vm) > MAX_MEMORY) {
    	this.vm = null;
    	this.dead = true;
    	throw "Robot exceeded memory limits.";
    }

    return action;
    
}

module.exports = CrossVM;