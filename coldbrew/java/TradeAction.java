package robot;
import java.util.ArrayList;

public class TradeAction extends Action {
	String action;
	int trade_fuel;
	int trade_karbonite;

	public TradeAction(int trade_fuel, int trade_karbonite, int signal, int signalRadius, ArrayList<String> logs, int castleTalk) {
		super(signal, signalRadius, logs, castleTalk);
		
		action = "trade";
		this.trade_fuel = trade_fuel;
		this.trade_karbonite = trade_karbonite;
	}
}