package robot;
import java.util.ArrayList;

public class BCAbstractRobot {
    public SpecHolder SPECS;

    private GameState gameState;
    private ArrayList<String> logs;
    private int signal;
    private int signalRadius;
    private int castleTalk;

    public Robot me;
    public int id;
    public int fuel;
    public int karbonite;
    public int[][] lastOffer;

    public BCAbstractRobot(SpecHolder specs) {
        SPECS = specs;
        resetState();
    }

    private void resetState() {
        logs = new ArrayList<String>();
        signal = 0;
        signalRadius = 0;
        castleTalk = 0;
    }

    public Action _do_turn(GameState gameState) {
        this.gameState = gameState;
        
        id = gameState.id;
        karbonite = gameState.karbonite;
        fuel = gameState.fuel;
        lastOffer = gameState.last_offer;

        this.me = getRobot(this.id);

        Action t = null;
        
        try {
            t = turn();
        } catch (Exception e) {
            t = new ErrorAction(e, signal, signalRadius, logs, castleTalk);
        }

        if (t == null) t = new Action(signal, signalRadius, logs, castleTalk);

        resetState();

        return t;
    }

    private boolean checkOnMap(int x, int y) {
        return x >= 0 && x < gameState.shadow[0].length && y >= 0 && y < gameState.shadow.length;
    }

    public void log(String message) {
        logs.add(message);
    }

    public void signal(int value, int radius) throws BCException {
        if (fuel < radius) throw new BCException("Not enough fuel to signal given radius.");

        if (value < 0 || value >= Math.pow(2, SPECS.COMMUNICATION_BITS)) throw new BCException("Invalid signal, must be within bit range.");
        if (radius > 2*Math.pow(SPECS.MAX_BOARD_SIZE-1,2)) throw new BCException("Signal radius is too big.");

        signal = value;
        signalRadius = radius;

        fuel -= radius;
    }

    public void castleTalk(int value) throws BCException {
        if (value < 0 || value >= Math.pow(2,SPECS.CASTLE_TALK_BITS)) throw new BCException("Invalid castle talk, must be between 0 and 2^8.");

        castleTalk = value;
    }

    public TradeAction proposeTrade(int karbonite, int fuel) {
        if (this.me.unit != SPECS.CASTLE) throw new BCException("Only castles can trade.");
        if (Math.abs(karbonite) >= SPECS.MAX_TRADE || Math.abs(fuel) >= SPECS.MAX_TRADE) throw new BCException("Cannot trade over " + Integer.toString(SPECS.MAX_TRADE) + " in a given turn.");

        return new TradeAction(fuel, karbonite, signal, signalRadius, logs, castleTalk);
    }

    public Robot getRobot(int id) {
        if (id <= 0) return null;
        for (int i=0; i<gameState.visible.length; i++) {
            if (gameState.visible[i].id == id) {
                return gameState.visible[i];
            }
        }

        return null;
    }
    
    // Get map of visible robot IDs.
    public int[][] getVisibleRobotMap() {
        return gameState.shadow;
    }

    // Get boolean map of passable terrain.
    public boolean[][] getPassableMap() {
        return gameState.map;
    }

    // Get boolean map of karbonite points.
    public boolean[][] getKarboniteMap() {
        return gameState.karbonite_map;
    }

    // Get boolean map of impassable terrain.
    public boolean[][] getFuelMap() {
        return gameState.fuel_map;
    }

    // Get a list of robots visible to you.
    public Robot[] getVisibleRobots() {
        return gameState.visible;
    }


    public Action turn() throws Exception {
        return null;
    }
}