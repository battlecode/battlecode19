package robot;

public class MyRobot extends BCAbstractRobot {
    public Action turn() {
    	log(Integer.toString(karbonite) + ", " + Integer.toString(fuel));
        return proposeTrade(10,-10);
    }
}