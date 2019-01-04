package robot;

import java.util.ArrayList;

@jsweet.lang.Interface
public class Robot {
	public int id;
	public int team;
	public int x;
	public int y;
	public int unit;

	//@jsweet.lang.Optional
	public int health;
	public int karbonite;
	public int fuel;

	public int signal;
	public int signal_radius;
	public int castle_talk;
}