class Visualizer {
    constructor(canvas, mapWidth, mapHeight, map) {
        this.width = mapWidth;
        this.height = mapHeight;

        this.canvas = document.getElementById(canvas);
        this.ctx = this.canvas.getContext("2d");
        this.map = map;

        this.rounds = {};
        this.round = 0;
        this.nextRound = 0;

        this.BLOCK_SIZE = 10;
        this.PAD_INIT = 100;
        this.PAD = 1;
        this.ROBOT_MAX_HEALTH = 64;
        this.movePercent = 0;
        this.running = true;

        this.infoBox = null;

        this.initializeCanvas();
        this.render();
    }

    initializeCanvas() {
        this.canvas.setAttribute('width', window.getComputedStyle(this.canvas, null).getPropertyValue("width"));
        this.canvas.setAttribute('height', window.getComputedStyle(this.canvas, null).getPropertyValue("height"));

        var w_scale = (this.canvas.width-this.PAD_INIT)/(this.BLOCK_SIZE*this.width);
        var h_scale = (this.canvas.height-this.PAD_INIT)/(this.BLOCK_SIZE*this.height);

        // scale, dx from center, dy from center
        this.pos = [Math.min(w_scale, h_scale),0,0];

        this.canvas.addEventListener('wheel',this.handleScroll.bind(this),true);

        function getTransformedClick(context, e) {
            var lastX = e.offsetX || (e.pageX - context.canvas.offsetLeft);
            var lastY = e.offsetY || (e.pageY - context.canvas.offsetTop);
            return {x:lastX, y:lastY};
        }

        this.canvas.addEventListener('mousedown', function(e) {
            this.dragStart = getTransformedClick(this, e);

            this.dragStart.x -= this.pos[1];
            this.dragStart.y -= this.pos[2];

            this.dragged = false;
        }.bind(this),false);

        this.canvas.addEventListener('mousemove',function(e){
            this.dragged = true;
            if (this.dragStart) {
                var pt = getTransformedClick(this, e);
                this.pos[1] = pt.x-this.dragStart.x;
                this.pos[2] = pt.y-this.dragStart.y;

                this.render();
            }
        }.bind(this),false);

        this.canvas.addEventListener('mouseup',function(e){
            if (!this.dragged) {
                var original = JSON.parse(JSON.stringify(this.dragStart));
                var r = Math.sqrt(Math.pow(original.x-47,2) + Math.pow(original.y-this.canvas.height+25,2));
                if (r <= 15) {
                    this.running = !this.running;
                    this.dragStart = null;
                    this.render();
                    return
                } else if (!this.running) {
                    r = Math.sqrt(Math.pow(original.x-20,2) + Math.pow(original.y-this.canvas.height+25,2));
                    if (r <= 10) {
                        if ((this.round - 1) in this.rounds) this.nextRound = this.round - 1;
                        this.dragStart = null;
                        this.render();
                        return
                    }
                    r = Math.sqrt(Math.pow(original.x-74,2) + Math.pow(original.y-this.canvas.height+25,2));
                    if (r <= 10) {
                        if ((this.round + 1) in this.rounds) this.nextRound = this.round + 1;
                        this.dragStart = null;
                        this.render();
                        return
                    }
                }

                this.dragStart.x -= (this.canvas.width/2 - this.pos[0]*this.BLOCK_SIZE*this.width/2);
                this.dragStart.y -= (this.canvas.height/2 - this.pos[0]*this.BLOCK_SIZE*this.height/2);

                this.dragStart.x /= this.pos[0];
                this.dragStart.y /= this.pos[0];

                // Check if click occurs outside of a box
                var b = this.dragStart.x % this.BLOCK_SIZE < this.PAD
                     || this.dragStart.x % this.BLOCK_SIZE > this.BLOCK_SIZE - this.PAD
                     || this.dragStart.y % this.BLOCK_SIZE < this.PAD
                     || this.dragStart.y % this.BLOCK_SIZE > this.BLOCK_SIZE - this.PAD
                     || this.dragStart.x > this.BLOCK_SIZE*this.width
                     || this.dragStart.y > this.BLOCK_SIZE*this.height
                     || this.dragStart.x < 0 || this.dragStart.y < 0;

                if (!b) {
                    this.clickBlock(
                        Math.floor(this.dragStart.x / this.BLOCK_SIZE),
                        Math.floor(this.dragStart.y / this.BLOCK_SIZE)
                    );
                } else this.clickBlock(null,null);
            }

            this.dragStart = null;
        }.bind(this),false);
    }

    clickBlock(x, y) {
        if (x === null || (this.infoBox && this.infoBox.x === x && this.infoBox.y === y) || this.map[x + y*this.width]) {
            this.infoBox = null;
        } else this.infoBox = {x:x, y:y, content:null};
        this.render();
    }

    renderInfoBox() {
        if (this.infoBox === null) return;
        var robots = this.rounds[this.round].robots;

        this.infoBox.content = null;
        for (var i=0; i<robots.length; i++) {
            if (robots[i].x === this.infoBox.x && robots[i].y === this.infoBox.y)
                this.infoBox.content = robots[i];
        }

        this.ctx.beginPath();

        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        this.ctx.fillStyle = "#000";
        this.ctx.strokeStyle = "#fff"
        this.ctx.font = "15px Roboto Mono, monospace";
        this.ctx.textAlign = "left";

        this.ctx.rect(0,0,155,this.infoBox.content?98:37);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.fillStyle = "#00ff00";

        this.ctx.fillText("Pos: [" + this.infoBox.x + ", " + this.infoBox.y + "]", 9, 26); 
        if (this.infoBox.content) {
            this.ctx.fillText("Robot ID: " + this.infoBox.content.id, 9, 46);
            this.ctx.fillText("Health: " + this.infoBox.content.health, 9, 66);
            this.ctx.fillText("Signal: " + this.infoBox.content.signal, 9, 86);
        }
        this.ctx.fill();
    }

    renderControlBox() {
        this.ctx.beginPath();

        this.ctx.fillStyle = "#000";
        this.ctx.strokeStyle = "#fff"
        this.ctx.font = "25px Roboto Mono, monospace";
        this.ctx.textAlign = "center";

        var box_width = 94;
        var box_height = 50;

        this.ctx.rect(0,this.canvas.height-box_height,box_width,box_height);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.rect(this.canvas.width-box_width,this.canvas.height-box_height,box_width,box_height);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = "#fff";

        this.ctx.beginPath();
        this.ctx.fillText(this.round,this.canvas.width-box_width/2,this.canvas.height-box_height/2+8);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(47,this.canvas.height - 25, 15, 0, 2*Math.PI);
        this.ctx.fill();

        if (!this.running) {
            if (this.round - 1 in this.rounds) {
                this.ctx.beginPath();
                this.ctx.moveTo(25, this.canvas.height - 15);
                this.ctx.lineTo(25, this.canvas.height - 50 + 15);
                this.ctx.lineTo(15, this.canvas.height - 25);
                this.ctx.fill();
            }

            if (this.round + 1 in this.rounds) {
                this.ctx.beginPath();
                this.ctx.moveTo(69, this.canvas.height - 15);
                this.ctx.lineTo(69, this.canvas.height - 50 + 15);
                this.ctx.lineTo(79, this.canvas.height - 25);
                this.ctx.fill();
            }

            this.ctx.fillStyle = "#000"
            this.ctx.beginPath();
            this.ctx.moveTo(43, this.canvas.height-32);
            this.ctx.lineTo(43, this.canvas.height-18);
            this.ctx.lineTo(54, this.canvas.height-25);
            this.ctx.fill();
        } else {
            this.ctx.fillStyle = "#000"
            this.ctx.fillRect(40,this.canvas.height-32,14,14);
        }

    }

    gameOver(reason) {

    }

    starting() {

    }

    stopped() {
        return !this.running;
    }

    handleScroll(e) {
        var delta = e.deltaY;

        if (delta && this.pos[0]+delta/60 > 0) {
            this.pos[0] += delta/60;
            this.render();
        }

        return e.preventDefault();
    }

    feedRound(round, message) {
        this.rounds[round] = JSON.parse(
            JSON.stringify(message)
        );
    }

    setRound(round) {
        this.nextRound = round;
        this.render();
    }

    render(time_to_render) {
        var time = time_to_render/10 || 10;

        // Clear frame and save context
        this.ctx.fillStyle = "#333";

        this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
        this.ctx.save();

        // Perform pan and scale.
        this.ctx.translate(this.pos[1],this.pos[2]);
        this.ctx.scale(this.pos[0],this.pos[0]);

        // Pan back to fix odd pan/zoom issue.
        var f = 0.5*(1-this.pos[0])/this.pos[0];
        this.ctx.translate(f*this.canvas.width,f*this.canvas.height);

        // Set up the map in the top left to ease drawing.
        var MAP_INDEX = [
            this.canvas.width/2 - this.BLOCK_SIZE*this.width/2,
            this.canvas.height/2-this.BLOCK_SIZE*this.height/2
        ]; this.ctx.translate(MAP_INDEX[0], MAP_INDEX[1]);

        // Actually render the scene!
        this.renderMap();

        if (this.nextRound != null) var need_refresh = this.renderRound(this.round);

        // Shift the map back to it's correct position.             
        this.ctx.translate(-MAP_INDEX[0], -MAP_INDEX[1]);

        // Restore the context.
        this.ctx.restore();

        // Render the info box.
        this.renderInfoBox();

        // Render the control box.
        this.renderControlBox();

        // Re-render if necessary.
        if (need_refresh) setTimeout(this.render.bind(this), time_to_render, time);
    }

    renderMap() {
        this.ctx.beginPath();
        this.ctx.shadowColor = '#00ff00';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        this.ctx.fillStyle = "#eee";
        for (var c=0; c<this.width; c++) {
            for (var r=0; r<this.height; r++) {
                if (this.map[this.width*r + c]) continue;
                if (this.infoBox != null && this.infoBox.x === c && this.infoBox.y === r) continue;
                this.ctx.rect(c*this.BLOCK_SIZE + this.PAD,
                              r*this.BLOCK_SIZE + this.PAD,
                              this.BLOCK_SIZE - 2*this.PAD,
                              this.BLOCK_SIZE - 2*this.PAD);
            }
        } this.ctx.fill();

        // Draw selected box seperately, as different color.
        if (this.infoBox != null) {
            this.ctx.beginPath();
            this.ctx.fillStyle = "#aaa";
            this.ctx.shadowBlur = 5;
            this.ctx.rect(this.infoBox.x*this.BLOCK_SIZE + this.PAD,
                          this.infoBox.y*this.BLOCK_SIZE + this.PAD,
                          this.BLOCK_SIZE - 2*this.PAD,
                          this.BLOCK_SIZE - 2*this.PAD);
            this.ctx.fill();
        }

        
    }

    renderRound() {
        if (!(this.nextRound in this.rounds)) return false;

        var robots = this.rounds[this.nextRound].robots;
        var nexi = this.rounds[this.nextRound].nexi;

        var past_robots = [];
        if (this.round in this.rounds) {
            past_robots = this.rounds[this.round].robots;
        } else this.movePercent = 1;


        // Draw nexi
        this.ctx.beginPath();
        this.ctx.shadowBlur = 2;
        this.ctx.shadowColor = '#fd5f00';
        this.ctx.strokeStyle = "#fd5f00";
        this.ctx.lineWidth = 0.5;

        var i = 0;

        // For each nexus list
        for (var n=0; n<nexi.length; n++) {
            var coords = [];
            
            // For each id in the nexus, find the coords
            for (i=0; i<nexi[n].length; i++) {
                for (var r=0; r<robots.length; r++) {
                    if (robots[r].id === nexi[n][i]) {
                        coords.push({x:robots[r].x, y:robots[r].y});
                        break;
                    }
                }
            }

            for (i=0; i<coords.length-1; i++) {
                this.ctx.moveTo(this.BLOCK_SIZE*(coords[i].x+0.5),
                                this.BLOCK_SIZE*(coords[i].y+0.5));
                this.ctx.lineTo(this.BLOCK_SIZE*(coords[i+1].x+0.5),
                                this.BLOCK_SIZE*(coords[i+1].y+0.5));
            } this.ctx.moveTo(this.BLOCK_SIZE*(coords[0].x+0.5),
                              this.BLOCK_SIZE*(coords[0].y+0.5));
            this.ctx.lineTo(this.BLOCK_SIZE*(coords[coords.length-1].x+0.5),
                            this.BLOCK_SIZE*(coords[coords.length-1].y+0.5));
        }

        this.ctx.stroke();

        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#333';

        // Draw robots
        for (i=0; i<robots.length; i++) {
            var robot = robots[i];

            var past_robot = robot;
            for (var k=0; k<past_robots.length; k++)
                if (robot.id === past_robots[k].id)
                    past_robot = past_robots[k];

            var x = (1-this.movePercent)*past_robot.x + this.movePercent*robot.x;
            var y = (1-this.movePercent)*past_robot.y + this.movePercent*robot.y;
            var h = (1-this.movePercent)*past_robot.health + this.movePercent*robot.health;

            this.ctx.beginPath();
            this.ctx.fillStyle = robot.team === 0 ? "#DD0048":"blue";
            this.ctx.arc((x + 0.5)*this.BLOCK_SIZE,
                         (y + 0.5)*this.BLOCK_SIZE,
                         0.5*(this.BLOCK_SIZE-5*this.PAD)*(0.2 + 0.8*h/this.ROBOT_MAX_HEALTH),
                         0, 2*Math.PI);
            this.ctx.fill();
        }

        if (this.movePercent < 1) {
            this.movePercent = Math.min(1,this.movePercent + 0.1);
            
            return true;
        } else {
            this.movePercent = 0;
            this.round = this.nextRound;
            return false;
        }
    }
}

export default Visualizer;

