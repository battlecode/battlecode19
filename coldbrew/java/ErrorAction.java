package robot;
import java.util.ArrayList;

public class ErrorAction extends Action {
	String error;

	public ErrorAction(Exception error, int signal, int signalRadius, ArrayList<String> logs, int castleTalk) {
		super(signal, signalRadius, logs, castleTalk);
		
		this.error = error.getMessage();
	}
}