package robot;

import java.util.ArrayList;

public class Action {
	public int signal;
	public int signal_radius;
	public ArrayList<String> logs;
	public int castle_talk;

	public Action(int signal, int signalRadius, ArrayList<String> logs, int castleTalk) {
		this.signal = signal;
		this.signal_radius = signalRadius;
		this.logs = logs;
		this.castle_talk = castleTalk;
	}
}