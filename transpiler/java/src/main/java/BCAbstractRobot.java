package robot;

public class BCAbstractRobot {
	Object gameState;
	
	public Action move(int direction) {
		return new Action(0,direction);
	}
	
	public Action doTurn(Object gameState) {
		this.gameState = gameState;
		return turn();
	}
	
	public Action turn() {
		return null;
	}
}