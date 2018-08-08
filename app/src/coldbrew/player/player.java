package robot;

public class Action {
	int type;
	int direction;
	
	public Action(int type, int direction) {
		direction = direction;
		type = type;
	}
}

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

////////////////////////////

public class MyRobot extends BCAbstractRobot {
	public Action turn() {
		return move(0);
	}
}

///////////////////////////

var robot = {'robot':new robot.MyRobot()};
