import Game from 'coldbrew/game';

var CHECKPOINT = 100;
var TIME_PER_TURN = 50;

/*
Castle by BGBOXXX Design from the Noun Project
Church by Ben Davis from the Noun Project
Pilgrim Hat by Bonnie Beach from the Noun Project
Sword by uzeir syarief from the Noun Project
sniper by rizqa anindita from the Noun Project
Tank by Sandhi Priyasmoro from the Noun Project
*/

class Visualizer {
	constructor(canvas, replay) {
		this.replay = replay;

		// Parse replay seed
		var seed = 0;
		for (var i=0; i<4; i++) seed += this.replay[i] << (24-8*i);

		this.game = new Game(seed, 0, 0, false, false);
		this.checkpoints = [this.game.copy()];
		this.turn = 0;
		this.running = false;

		this.populateCheckpoints();
	}

	populateCheckpoints() {
		var last_checkpoint_turn = CHECKPOINT * (this.checkpoints.length-1);
		var new_checkpoint_turn = this.numTurns() - (this.numTurns()%CHECKPOINT); // checkpoint before/at numturns
		if (new_checkpoint_turn === last_checkpoint_turn) return; // have all possible checkpoints

		var last_checkpoint_game = this.checkpoints[this.checkpoints.length-1].copy();

		for (var i=last_checkpoint_turn+1; i<new_checkpoint_turn+1; i++) {
			// feed in the i-1th instruction
			var diff = this.replay.splice(4 + 8*(i-1), 4 + 8*i);
			last_checkpoint_game.enactTurn(diff);
			
			if (i%CHECKPOINT === 0) this.checkpoints.push(
				(i===new_checkpoint_turn) ? last_checkpoint_game : last_checkpoint_game.copy()
			);
		}
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
		for (var i=0; i<this.checkpoints.length; i++) {
			if (this.checkpoints[i].round > round) {
				this.game = this.checkpoints[i-1].copy();
				this.turn = (i-1)*CHECKPOINT;
				break;
			}
		}

		// Now, advance (bounded by the numTurns())
		for (var i=0; i<this.numTurns(); i++) {
			if (this.game.round !== round) this.nextTurn();
		}

	}

	nextTurn() {
		var diff = this.replay.spliceß(4 + 8*this.turn, 4 + 8*(this.turn+1));
		this.game.enactTurn(diff);
		this.turn++;
	}

	numTurns() {
		return (this.replay.length - 4)/8;
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