function CrossVM(code) {
    this.context = {};

    this.ensureIFrame();
    this.run(code);
}

CrossVM.prototype.ensureIFrame = function() {
	if (!window.exec_iframe) {
    	window.exec_iframe = document.createElement('iframe');
    	if (!window.exec_iframe.style) window.exec_iframe.style = {};
    	window.exec_iframe.style.display = 'none';
    
    	document.body.appendChild(window.exec_iframe);
    }
}

CrossVM.prototype.turn = function(message) {
	var code = "robot.robot._do_turn(" + message + ");"
	return this.run(code);
}

CrossVM.prototype.run = function(code) {
    var win = window.exec_iframe.contentWindow;
    var wEval = win.eval, wExecScript = win.execScript;

    if (!wEval && wExecScript) {
        // win.eval() magically appears when this is called in IE:
        wExecScript.call(win, 'null');
        wEval = win.eval;
    }

    Object.keys(this.context).forEach(function(key) {
        win[key] = this.context[key];
    }.bind(this));
    
    var winKeys = Object.keys(win);
    var res = wEval.call(win, code);
    
    Object.keys(win).forEach(function (key) {
        if (key in this.context || winKeys.indexOf(key) === -1) {
            this.context[key] = win[key];
            delete win[key];
        }
    }.bind(this));
        
    return res;
}

module.exports = CrossVM;