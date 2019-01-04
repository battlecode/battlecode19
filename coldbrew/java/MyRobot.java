package robot;

public class MyRobot extends BCAbstractRobot {
	MyRobot(SpecHolder s) {
        super(s);
    }

    public Action turn() throws Exception {
    	log(Integer.toString(karbonite) + ", " + Integer.toString(fuel));
        return proposeTrade(10,-10);
    }
}