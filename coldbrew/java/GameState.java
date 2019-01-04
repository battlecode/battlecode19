package robot;


@jsweet.lang.Interface
public class GameState {
	public int id;
	public int[][] shadow;
	public Robot[] visible;
	public boolean[][] map;
	public boolean[][] karbonite_map;
	public boolean[][] fuel_map;
	public int fuel;
	public int karbonite;
	public int[][] last_offer;
}