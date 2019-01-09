import Game from 'bc19/game';
import * as PIXI from "pixi.js";

var CHECKPOINT = 1000;
var TIME_PER_TURN = 50;

/*
Castle by BGBOXXX Design from the Noun Project
Church by Ben Davis from the Noun Project
Pilgrim Hat by Bonnie Beach from the Noun Project
Sword by uzeir syarief from the Noun Project
sniper by rizqa anindita from the Noun Project
Tank by Sandhi Priyasmoro from the Noun Project
*/
 
 
/*
"CASTLE": 0,
"CHURCH": 1,
"PILGRIM": 2,
"CRUSADER": 3,
"PROPHET": 4,
"PREACHER": 5,
"RED": 0,
"BLUE": 1,
*/
 
class Visualizer {
    constructor(div, replay, turn_callback, width=840, height=672) {
        this.replay = replay;

        // Parse replay seed
        var seed = 0;
        for (let i = 0; i<4; i++) seed += (this.replay[i+2] << (24-8*i));

        this.game = new Game(seed, 0, 0, false, false);
        this.checkpoints = [this.game.copy()];
        this.turn = 0;
        this.running = false;
        this.turn_callback = turn_callback || false;

        this.width = width;
        this.height = height;

        this.papa_container = document.getElementById(div);
        this.papa_container.innerHTML = "";
        this.container = document.createElement("div");
        this.robotInfo = document.createElement("div");
        this.papa_container.appendChild(this.container);
        this.papa_container.appendChild(this.robotInfo);

        this.papa_container.style.display = 'flex';
        this.container.style.flex = '0 0';
        this.robotInfo.style.flex = '1';
        this.robotInfo.style.marginLeft = '5px';

        this.populateCheckpoints();
        this.initViewer();

        this.draw();
    }

    initViewer() {
        this.active_x = -1;
        this.active_y = -1;
        this.active_id = 0;

        this.grid_width = this.height;
        this.grid_height = this.height;
        this.graph_width = this.width - this.grid_width;
        this.graph_height = this.height*.8;
 
        this.stage = new PIXI.Container();
        this.stage.interactive = true;
 
        this.stage.click = function(e) {
            var point = e.data.getLocalPosition(this.stage);
            this.active_x =  Math.floor(this.MAP_WIDTH * point.x / this.grid_width);
            this.active_y = Math.floor(this.MAP_HEIGHT * point.y / this.grid_height);
        }.bind(this);

        this.mapGraphics = new PIXI.Graphics();
        this.stage.addChild(this.mapGraphics);

        this.graphGraphics = new PIXI.Graphics();
        this.stage.addChild(this.graphGraphics);

        this.spritestage = new PIXI.Container();
        this.stage.addChild(this.spritestage);
 
        this.renderer = PIXI.autoDetectRenderer(0, 0, { backgroundColor: 0x222222, antialias: true, transparent: false });
        this.renderer.resize(this.width, this.height);
   
        // Clear container before draw
        this.container.innerHTML = '';
        this.container.append(this.renderer.view);

        var BLANK = '0x444444',
            OBSTACLE = '0xFFFFFF',//'0x111111',
            KARBONITE = '0x22BB22',
            FUEL = '0xFFFF00';
   
        this.MAP_WIDTH = this.game.map[0].length;
        this.MAP_HEIGHT = this.game.map.length;
        var draw_width = this.grid_width / this.MAP_WIDTH;
        var draw_height = this.grid_height / this.MAP_HEIGHT;
        this.mapGraphics.beginFill(BLANK);
        this.mapGraphics.drawRect(0, 0, this.grid_width, this.grid_height);
        this.mapGraphics.endFill();
        for (let y = 0; y < this.MAP_HEIGHT; y++) for (let x = 0; x < this.MAP_WIDTH; x++) {
            if (!this.game.map[y][x] || this.game.karbonite_map[y][x] || this.game.fuel_map[y][x]) {
                var color = this.game.karbonite_map[y][x] ? KARBONITE : this.game.fuel_map[y][x] ? FUEL : OBSTACLE;
                this.mapGraphics.beginFill(color);
                if (this.game.karbonite_map[y][x] || this.game.fuel_map[y][x]) {
                    const SIZE_FACTOR = 0.6;
                    const BORDER = (1 - SIZE_FACTOR) / 2;
                    this.mapGraphics.drawRect((x+BORDER)*draw_width, (y+BORDER)*draw_height, SIZE_FACTOR*draw_width, SIZE_FACTOR*draw_height);
                }
                else this.mapGraphics.drawRect(x*draw_width, y*draw_height, draw_width, draw_height);
                this.mapGraphics.endFill();
            }
        }

        // Gridlines
        this.mapGraphics.lineStyle(1, '0xFFFFFF');
        for(var y = 0; y <= this.MAP_HEIGHT; y++) {
            this.mapGraphics.moveTo(0, y*draw_height);
            this.mapGraphics.lineTo(this.grid_width, y*draw_height);
        }
        for(var x = 0; x <= this.MAP_WIDTH; x++){
            this.mapGraphics.moveTo(x*draw_width, 0);
            this.mapGraphics.lineTo(x*draw_width, this.grid_height);
        }

        // Indicate karbonite vs fuel sections of graphs
        this.mapGraphics.lineStyle(0);
        this.IND_G_WIDTH = this.graph_width*.8 / 2;
        this.LR_BORDER = (this.graph_width - 2*this.IND_G_WIDTH) / 3;
        this.T_BORDER_HEIGHT = this.graph_height * 0.14;
        this.KF_BORDER_HEIGHT = this.graph_height * 0.05;
        this.B_BORDER_HEIGHT = this.graph_height * 0.1;
        this.IND_G_HEIGHT = this.graph_height - (2*this.KF_BORDER_HEIGHT+this.T_BORDER_HEIGHT+this.B_BORDER_HEIGHT);
        this.mapGraphics.beginFill(KARBONITE);
        this.mapGraphics.drawRect(this.grid_width+this.LR_BORDER, this.T_BORDER_HEIGHT, this.IND_G_WIDTH, this.KF_BORDER_HEIGHT);
        this.mapGraphics.drawRect(this.grid_width+this.LR_BORDER, this.graph_height-this.B_BORDER_HEIGHT-this.KF_BORDER_HEIGHT, this.IND_G_WIDTH, this.KF_BORDER_HEIGHT);
        this.mapGraphics.endFill();
        this.mapGraphics.beginFill(FUEL);
        this.mapGraphics.drawRect(this.grid_width+this.IND_G_WIDTH+2*this.LR_BORDER, this.T_BORDER_HEIGHT, this.IND_G_WIDTH, this.KF_BORDER_HEIGHT);
        this.mapGraphics.drawRect(this.grid_width+this.IND_G_WIDTH+2*this.LR_BORDER, this.graph_height-this.B_BORDER_HEIGHT-this.KF_BORDER_HEIGHT, this.IND_G_WIDTH, this.KF_BORDER_HEIGHT);
        this.mapGraphics.endFill();
   
        // Initialize textures
        this.textures = new Array(6);
        this.textures[0] = PIXI.Texture.from('assets/img/castle.png');
        this.textures[1] = PIXI.Texture.from('assets/img/church.png');
        this.textures[2] = PIXI.Texture.from('assets/img/pilgrim.png');
        this.textures[3] = PIXI.Texture.from('assets/img/crusader.png');
        this.textures[4] = PIXI.Texture.from('assets/img/prophet.png');
        this.textures[5] = PIXI.Texture.from('assets/img/preacher.png');
   
        // Create large pools of castles, churches, and crusaders
        this.sprite_pools = new Array(6);
        for (let i = 0; i < 6; i++) this.sprite_pools[i] = [];
        
        for (let i = 0; i < 6; i++) { // Castles
            var sprite = new PIXI.Sprite(this.textures[0]);
            sprite.anchor = new PIXI.Point(0.5, 0.5);
            sprite.visible = false;
            this.spritestage.addChild(sprite);
            this.sprite_pools[0].push(sprite);
        }
        
        for (let i = 1; i < 6; i++) for (let j = 0; j < 200; j++) { // Other
            sprite = new PIXI.Sprite(this.textures[i]);
            sprite.anchor = new PIXI.Point(0.5, 0.5);
            sprite.visible = false;
            this.spritestage.addChild(sprite);
            this.sprite_pools[i].push(sprite);
        }

        // Deal with text
        this.red_karbtext = new PIXI.Text('', { fontFamily: "\"Courier New\", Courier, monospace", fontSize: 20, fill: '0xFF0000' });
        this.red_karbtext.position = new PIXI.Point(this.grid_width+this.LR_BORDER, this.graph_height-this.B_BORDER_HEIGHT+5);
        this.stage.addChild(this.red_karbtext);
        this.blue_karbtext = new PIXI.Text('', { fontFamily: "\"Courier New\", Courier, monospace", fontSize: 20, fill: '0x0000FF' });
        this.blue_karbtext.position = new PIXI.Point(this.grid_width+this.LR_BORDER, this.graph_height-this.B_BORDER_HEIGHT/2);
        this.stage.addChild(this.blue_karbtext);
        this.red_fueltext = new PIXI.Text('', { fontFamily: "\"Courier New\", Courier, monospace", fontSize: 20, fill: '0xFF0000' });
        this.red_fueltext.position = new PIXI.Point(this.grid_width+2*this.LR_BORDER+this.IND_G_WIDTH, this.graph_height-this.B_BORDER_HEIGHT+5);
        this.stage.addChild(this.red_fueltext);
        this.blue_fueltext = new PIXI.Text('', { fontFamily: "\"Courier New\", Courier, monospace", fontSize: 20, fill: '0x0000FF' });
        this.blue_fueltext.position = new PIXI.Point(this.grid_width+2*this.LR_BORDER+this.IND_G_WIDTH, this.graph_height-this.B_BORDER_HEIGHT/2);
        this.stage.addChild(this.blue_fueltext);

        this.roundtext = new PIXI.Text('', { fontFamily: "\"Courier New\", Courier, monospace", fontSize: 12, fill: '0xFFFFFF' });
        this.roundtext.position = new PIXI.Point(this.grid_width+10, 10);
        this.stage.addChild(this.roundtext);
        this.infotext = new PIXI.Text('Click somewhere for information!', { fontFamily: "\"Courier New\", Courier, monospace", fontSize: 12, fill: '0xFFFFFF',  wordWrap: true, wordWrapWidth: this.graph_width });
        this.infotext.position = new PIXI.Point(this.grid_width+10, this.graph_height);
        this.stage.addChild(this.infotext);
    }

    draw(strategic=false) { // for later perhaps making strategic view

        var draw_width = this.grid_width / this.MAP_WIDTH;
        var draw_height = this.grid_height / this.MAP_HEIGHT;

        // Draw graphs
        // First, figure out scaling for the graphs.
        const KARB_LINE = 20;
        const FUEL_LINE = 100;
        var MAX_KARB = Math.ceil(Math.max(5, this.game.karbonite[0]/KARB_LINE, this.game.karbonite[1]/KARB_LINE));
        var MAX_FUEL = Math.ceil(Math.max(5, this.game.fuel[0]/FUEL_LINE, this.game.fuel[1]/FUEL_LINE));
        // Then, draw! I'm so sorry this is so disgusting. We do, in order, red karb, red fuel, blue karb, and blue fuel.
        // This puts those in the right places.
        this.graphGraphics.clear();
        this.graphGraphics.beginFill('0xFF0000');
        this.graphGraphics.drawRect(this.grid_width+this.LR_BORDER,
            this.T_BORDER_HEIGHT+this.KF_BORDER_HEIGHT+this.IND_G_HEIGHT*(1-this.game.karbonite[0]/MAX_KARB/KARB_LINE),
            this.IND_G_WIDTH/2, this.IND_G_HEIGHT*this.game.karbonite[0]/MAX_KARB/KARB_LINE);
        this.graphGraphics.drawRect(this.grid_width+this.IND_G_WIDTH+2*this.LR_BORDER,
            this.T_BORDER_HEIGHT+this.KF_BORDER_HEIGHT+this.IND_G_HEIGHT*(1-this.game.fuel[0]/MAX_FUEL/FUEL_LINE),
            this.IND_G_WIDTH/2, this.IND_G_HEIGHT*this.game.fuel[0]/MAX_FUEL/FUEL_LINE);
        this.graphGraphics.endFill();
        this.graphGraphics.beginFill('0x0000FF');
        this.graphGraphics.drawRect(this.grid_width+this.IND_G_WIDTH/2+this.LR_BORDER,
            this.T_BORDER_HEIGHT+this.KF_BORDER_HEIGHT+this.IND_G_HEIGHT*(1-this.game.karbonite[1]/MAX_KARB/KARB_LINE),
            this.IND_G_WIDTH/2, this.IND_G_HEIGHT*this.game.karbonite[1]/MAX_KARB/KARB_LINE);
        this.graphGraphics.drawRect(this.grid_width+this.IND_G_WIDTH*3/2+2*this.LR_BORDER,
            this.T_BORDER_HEIGHT+this.KF_BORDER_HEIGHT+this.IND_G_HEIGHT*(1-this.game.fuel[1]/MAX_FUEL/FUEL_LINE),
            this.IND_G_WIDTH/2, this.IND_G_HEIGHT*this.game.fuel[1]/MAX_FUEL/FUEL_LINE);
        this.graphGraphics.endFill();

        // Draw markers in graphs.
        this.graphGraphics.lineStyle(2, '0xFFFFFF');
        for(var k = 1; k < MAX_KARB; k++) {
            this.graphGraphics.moveTo(this.grid_width+this.LR_BORDER, this.T_BORDER_HEIGHT+this.KF_BORDER_HEIGHT+k/MAX_KARB*this.IND_G_HEIGHT);
            this.graphGraphics.lineTo(this.grid_width+this.LR_BORDER+this.IND_G_WIDTH,this.T_BORDER_HEIGHT+this.KF_BORDER_HEIGHT+k/MAX_KARB*this.IND_G_HEIGHT);
        }
        for(var f = 1; f < MAX_FUEL; f++){
            this.graphGraphics.moveTo(this.grid_width+2*this.LR_BORDER+this.IND_G_WIDTH, this.T_BORDER_HEIGHT+this.KF_BORDER_HEIGHT+f/MAX_FUEL*this.IND_G_HEIGHT);
            this.graphGraphics.lineTo(this.grid_width+2*this.LR_BORDER+2*this.IND_G_WIDTH,this.T_BORDER_HEIGHT+this.KF_BORDER_HEIGHT+f/MAX_FUEL*this.IND_G_HEIGHT);
        }

        // Round text
        this.roundtext.text  = "Round  : "+this.game.round+"\n"
        this.roundtext.text += "Robin  : "+(isFinite(this.game.robin)?this.game.robin:0)+"\n";
        this.roundtext.text += "Turn   : "+this.turn+"\n"
        this.roundtext.text += "Winner : "+((this.game.winner === 0 || this.game.winner === 1)?(this.game.winner===0?'red':'blue'):"???")+"\n";

        // Draw text for the stats
        this.red_karbtext.text = ''+this.game.karbonite[0];
        this.blue_karbtext.text = ''+this.game.karbonite[1];

        this.red_fueltext.text = ''+this.game.fuel[0];
        this.blue_fueltext.text = ''+this.game.fuel[1];

        // Handle click and infotext
        if (this.active_x !== -1) {
            this.infotext.text = "Clicked (" + this.active_x + ", " + this.active_y + ")\n";

            // Find robot using x, y
            this.active_id = this.game.shadow[this.active_y][this.active_x];

            if (this.active_id === 0) {
                this.infotext.text  = "position   : ("+this.active_x+", "+this.active_y+")\n";
                this.infotext.text += "passable   : "+this.game.map[this.active_y][this.active_x]+"\n";
                this.infotext.text += "karbonite  : "+this.game.karbonite_map[this.active_y][this.active_x]+"\n";
                this.infotext.text += "fuel       : "+this.game.fuel_map[this.active_y][this.active_x]+"\n";
            }

            this.active_x = -1;
            this.active_y = -1;
        }
        if (this.active_id !== 0) {
            let robot = this.game.getItem(this.active_id);
            this.infotext.text  = "position   : ("+robot.x+", "+robot.y+")\n";
            this.infotext.text += "id         : "+robot.id+"\n";
            this.infotext.text += "team       : "+["red", "blue"][robot.team]+"\n";
            this.infotext.text += "unit       : "+["castle", "church", "pilgrim", "crusader", "prophet", "preacher"][robot.unit]+"\n";
            this.infotext.text += "health     : "+robot.health+"\n";
            this.infotext.text += "karbonite  : "+robot.karbonite+"\n";
            this.infotext.text += "fuel       : "+robot.fuel+"\n";
            this.infotext.text += "signal     : "+robot.signal+"\n";
            this.infotext.text += "castletalk : "+robot.castle_talk+"\n";
        }


        // Draw units       
        var units = new Array(6);
        for (let i = 0; i < 6; i++) units[i] = [];
        for (let i = 0; i < this.game.robots.length; i++) {
            units[this.game.robots[i].unit].push(this.game.robots[i]);
        }

        for (let i = 0; i < 6; i++) {
            var counter = 0;
            for (let j = 0; j < units[i].length; j++) {
                let robot = units[i][j];
                let s = this.sprite_pools[i][counter];
                s.visible = true;
                s.width = draw_width;
                s.height = draw_height;
                s.position = new PIXI.Point(draw_width*(robot.x+.5), draw_height*(robot.y+.5));
                s.tint = robot.team === 0 ? 0xFF0000 : 0x0000FF;
                counter++;
            }
        }

        
       
        this.renderer.render(this.stage);

        // Remove text
        //this.stage.removeChild(red_karbtext);
        //this.stage.removeChild(blue_karbtext);
        //this.stage.removeChild(red_fueltext);
        //this.stage.removeChild(blue_fueltext);
       
        // Reset all sprite pools to be invisible
        for (let i = 0; i < 6; i++) this.sprite_pools[0][i].visible = false; // Castles
        for (let i = 1; i < 6; i++) for (let j = 0; j < this.sprite_pools[i].length && this.sprite_pools[i][j].visible; j++) this.sprite_pools[i][j].visible = false; // Other
       
        requestAnimationFrame(function() {
            setTimeout(this.draw.bind(this),50);
        }.bind(this));
    }

    populateCheckpoints() {
        var last_checkpoint_turn = CHECKPOINT * (this.checkpoints.length-1);
        var final_checkpoint_turn = this.numTurns() - (this.numTurns()%CHECKPOINT); // checkpoint before/at numturns
        if (final_checkpoint_turn === last_checkpoint_turn) return; // have all possible checkpoints

        var last_checkpoint_game = this.checkpoints[this.checkpoints.length-1].copy();

        for (let i = last_checkpoint_turn+1; i<final_checkpoint_turn+1; i++) {
            console.log('checkpoint i = '+i);
            // feed in the i-1th instruction
            var diff = this.replay.slice(6 + 8*(i-1), 6 + 8*i);
            last_checkpoint_game.enactTurn(diff);
            if (i%CHECKPOINT === 0) {
                this.checkpoints.push(last_checkpoint_game);
                break;
            }
        }

        setTimeout(this.populateCheckpoints.bind(this),50);
    }

    goToTurn(turn) {
        // Ignore if already at turn.
        if (turn === this.turn) return;

        // First, go to nearest earlier/equal checkpoint.
        var last_checkpoint_turn = turn - turn%CHECKPOINT;

        // If we are currently at or greater than last_checkpoint_turn (and less than turn),
        // just use that.  Otherwise, load from last checkpoint.

        if (this.turn < last_checkpoint_turn || this.turn >= turn) {
            this.game = this.checkpoints[last_checkpoint_turn/CHECKPOINT].copy();
            this.turn = last_checkpoint_turn;
        }

        // Now, while this.turn < turn, go forward.
        while (this.turn < turn) this.nextTurn();
    }

    goToRound(round) {
        // Find the first checkpoint with game.round greater than round, then take the one before it.
        // If no such checkpoint exists, take the last checkpoint and hope for the best.
        this.game = this.checkpoints[this.checkpoints.length-1].copy();
        this.turn = this.checkpoints.length*CHECKPOINT
        for (let i = 0; i<this.checkpoints.length; i++) {
            if (this.checkpoints[i].round > round) {
                this.game = this.checkpoints[i-1].copy();
                this.turn = (i-1)*CHECKPOINT;
                break;
            }
        }

        // Now, advance (bounded by the numTurns())
        for (let i = 0; i<this.numTurns(); i++) {
            if (this.game.round !== round) this.nextTurn();
        }

    }

    nextTurn() {
        var diff = this.replay.slice(6 + 8*this.turn, 6 + 8*(this.turn+1));
        this.game.enactTurn(diff);
        this.turn++;
        if (this.turn_callback) this.turn_callback(this.turn);
    }

    numTurns() {
        return (this.replay.length - 6)/8;
    }

    startStop() {
        if (this.running) {
            clearInterval(this.interval);
            this.running = false;
        } else {
            this.running = true;
            this.interval = setInterval(function () {
                if (this.turn < this.numTurns()) this.goToTurn(this.turn + 1);
                else this.startStop();
            }.bind(this), TIME_PER_TURN); 
        }
    }

    renderGame() {
        // pass, this will come from michael
    }


}

export default Visualizer;