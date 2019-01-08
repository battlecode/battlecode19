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
    constructor(div, replay, turn_callback, width, height) {
        this.replay = replay;

        // Parse replay seed
        var seed = 0;
        for (let i = 0; i<4; i++) seed += (this.replay[i+2] << (24-8*i));

        this.game = new Game(seed, 0, 0, false, false);
        this.checkpoints = [this.game.copy()];
        this.turn = 0;
        this.running = false;
        this.turn_callback = turn_callback || false;

        this.width = width || 640;
        this.height = height || 640;

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
 
        this.stage = new PIXI.Container();
        this.stage.interactive = true;
 
        this.stage.click = function(e) {
            var point = e.data.getLocalPosition(this.stage);
            this.active_x =  Math.floor(this.MAP_WIDTH * point.x / this.width);
            this.active_y = Math.floor(this.MAP_HEIGHT * point.y / this.height);
        }.bind(this);

        this.mapGraphics = new PIXI.Graphics();
        this.stage.addChild(this.mapGraphics);

        this.spritestage = new PIXI.Container();
        this.stage.addChild(this.spritestage);

        var BLANK = 0x666666,
            OBSTACLE = '0x111111',
            KARBONITE = '0x22BB22',
            FUEL = '0xFFFF00';
 

        this.renderer = PIXI.autoDetectRenderer(0, 0, { backgroundColor: BLANK, antialias: true, transparent: false });
        this.renderer.resize(this.width, this.height);
   
        // Clear container before draw
        this.container.innerHTML = '';
        this.container.append(this.renderer.view);
   
        this.MAP_WIDTH = this.game.map[0].length;
        this.MAP_HEIGHT = this.game.map.length;
        var draw_width = this.width / this.MAP_WIDTH;
        var draw_height = this.height / this.MAP_HEIGHT;
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

        this.mapGraphics.lineStyle(1, '0xFFFFFF');
        for(var y = 0; y < this.MAP_HEIGHT; y++) {
            this.mapGraphics.moveTo(0, y*draw_height);
            this.mapGraphics.lineTo(this.width, y*draw_height);
        }
        for(var x = 0; x < this.MAP_WIDTH; x++){
            this.mapGraphics.moveTo(x*draw_width, 0);
            this.mapGraphics.lineTo(x*draw_width, this.height);
        }
   
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
    }

    draw(strategic=false) { // for later perhaps making strategic view

        var draw_width = this.width / this.MAP_WIDTH;
        var draw_height = this.height / this.MAP_HEIGHT;
       
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
       
        this.robotInfo.innerText = "Round " + this.game.round + ", robin " + (isFinite(this.game.robin)?this.game.robin:0) + ", turn " + this.turn + "\n";
        if (this.game.winner === 0 || this.game.winner === 1) this.robotInfo.innerText += "Winner is " + (this.game.winner===0?'red':'blue') + "\n";

        // Handle click
        if (this.active_x !== -1) {
            this.robotInfo.innerText += "Clicked " + this.active_x + ", " + this.active_y;

            // Find robot using x, y
            this.active_id = this.game.shadow[this.active_y][this.active_x];

            if (this.active_id !== 0) {
                let robot = this.game.getItem(this.active_id);
                this.robotInfo.innerText += "\n" + JSON.stringify(robot,null, 2);
            }
        }
       
        this.renderer.render(this.stage);
       
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