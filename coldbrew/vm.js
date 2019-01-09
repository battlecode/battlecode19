var {VM} = require('vm2');
var sizeof = require('object-sizeof');
var SPECS = require('./specs');

function CrossVM(code) {
    this.vm = new VM({ timeout:SPECS.TURN_MAX_TIME, console: 'off' });
    
    this.vm.run(code);

    this.dead = false;
}

CrossVM.prototype.turn = function(message) {
	if (this.dead) throw "Robot exceeded memory limits.";
    var action = this.vm.run(message);
    
    /*
    if (sizeof(this.vm) > SPECS.MAX_MEMORY) {
    	this.vm = null;
    	this.dead = true;
    	throw "Robot exceeded memory limits.";
    }*/
    

    return action;
}

module.exports = CrossVM;