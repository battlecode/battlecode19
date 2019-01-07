import React, { Component } from 'react';
import SPECS from 'coldbrew/specs';
import styled from 'styled-components';

const He = styled.h5`
  font-weight: bold;
  font-size:1.3em;
`;

const Hee = styled.h5`
  text-decoration:underline;
  font-size:1.2em;
`;

class RobotTable extends Component {
    render() {
        return (
            <table className="table">
                <thead><tr>
                    <th scope="col"></th>
                    <th scope="col">Pilgrim</th>
                    <th scope="col">Crusader</th>
                    <th scope="col">Prophet</th>
                    <th scope="col">Preacher</th>
                </tr></thead>
                <tbody>
                <tr>
                    <th scope="row">Construction Karbonite</th>
                    { SPECS.UNITS.slice(2).map(function(unit) {
                        return (
                            <td>{unit.CONSTRUCTION_KARBONITE}</td>
                        );
                    }) }
                </tr>
                <tr>
                    <th scope="row">Construction Fuel</th>
                    { SPECS.UNITS.slice(2).map(function(unit) {
                        return (
                            <td>{unit.CONSTRUCTION_FUEL}</td>
                        );
                    }) }
                </tr>
                <tr>
                    <th scope="row">Karbonite Carrying Capacity</th>
                    { SPECS.UNITS.slice(2).map(function(unit) {
                        return (
                            <td>{unit.KARBONITE_CAPACITY}</td>
                        );
                    }) }
                </tr>
                <tr>
                    <th scope="row">Fuel Carrying Capacity</th>
                    { SPECS.UNITS.slice(2).map(function(unit) {
                        return (
                            <td>{unit.FUEL_CAPACITY}</td>
                        );
                    }) }
                </tr>
                <tr>
                    <th scope="row">Movement Speed (r^2)</th>
                    { SPECS.UNITS.slice(2).map(function(unit) {
                        return (
                            <td>{unit.SPEED}</td>
                        );
                    }) }
                </tr>
                <tr>
                    <th scope="row">Movement Fuel Cost (per r^2)</th>
                    { SPECS.UNITS.slice(2).map(function(unit) {
                        return (
                            <td>{unit.FUEL_PER_MOVE}</td>
                        );
                    }) }
                </tr>
                <tr>
                    <th scope="row">Starting Health</th>
                    { SPECS.UNITS.slice(2).map(function(unit) {
                        return (
                            <td>{unit.STARTING_HP}</td>
                        );
                    }) }
                </tr>
                <tr>
                    <th scope="row">Vision Radius (r^2)</th>
                    { SPECS.UNITS.slice(2).map(function(unit) {
                        return (
                            <td>{unit.VISION_RADIUS}</td>
                        );
                    }) }
                </tr>
                <tr>
                    <th scope="row">Attack Damage</th>
                    { SPECS.UNITS.slice(2).map(function(unit) {
                        return unit.ATTACK_DAMAGE===null?(<td>N/A</td>):(
                            <td>{unit.ATTACK_DAMAGE}HP {unit.DAMAGE_SPREAD!==0?"for " + unit.DAMAGE_SPREAD + " squares":""}</td>
                        );
                    }) }
                </tr>
                <tr>
                    <th scope="row">Attack Range (r^2)</th>
                    { SPECS.UNITS.slice(2).map(function(unit) {
                        return unit.ATTACK_RADIUS===null?(<td>N/A</td>):(
                            <td>{unit.ATTACK_RADIUS[0]}-{unit.ATTACK_RADIUS[1]}</td>
                        );
                    }) }
                </tr>
                <tr>
                    <th scope="row">Attack Fuel Cost</th>
                    { SPECS.UNITS.slice(2).map(function(unit) {
                        return unit.ATTACK_FUEL_COST===null?(<td>N/A</td>):(
                            <td>{unit.ATTACK_FUEL_COST}</td>
                        );
                    }) }
                </tr>
                
                
                </tbody>
            </table>
        );
    }
}

class Docs extends Component {
    render() {
        return (
            <div className="content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-md-12">
                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Battlecode: Crusade Official Game Specs</h4>
                                    <p className="category">Updated 1/7/19 7:00PM EST</p>
                                </div>
                                <div className="content">
                                    <p>The planet of Mars is a house divided.  Only ten short years after the great war for the red planet, two opposing religious dogmas have emerged from the chaos.  The Religious Exploratory Doctrinists (RED) believe that the only route to peace in the galaxy is by spreading the robot way of peace, while the Believers of Lasting Unity Everywhere (BLUE) claim that only by non-aggression can robotkind remain.  The only possible resolution?  Total war.</p>
                                    <He>Game Format</He>
                                    <p>Battlecode: Crusade is a turn based game, where robots on a tiled grid are each controlled by individual computer programs.  Robots include Castles, Churches, Pilgrims, Crusaders, Prophets, and Preachers.  The objective of the game is to destroy the enemy team Castles.  If by { SPECS.MAX_ROUNDS } rounds both blue and red Castles remain, the winner is determined by the team with more castles, followed by the team with more unit value, followed by a coin flip.</p>
                                    <He>Map and Resources Overview</He>
                                    <p>Game maps are procedurally generated, and are square 2d grids ranging between 50x50 and 100x100 tiles.  Every map is either horizontally or vertically symmetric, and the top left corner has the coordinates (0,0).   Each tile in the map is either passable or impassable rocky terrain, and each team starts with 1-3 Castles on the map, { SPECS.INITIAL_KARBONITE } Karbonite, and { SPECS.INITIAL_FUEL } Fuel.</p>
                                    <p>Passable tiles can have resource points on them which when mined by Pilgrims provide either Karbonite, which is used to construct units, or Fuel, which is used to run them.  Once mined, these resources can be transferred between units and deposited for global usage at Castles or Churches.  Almost any action in Battlecode Crusade consumes either Karbonite or Fuel.  Note that rather than being distributed evenly, Karbonite and Fuel depots are usually found in small discrete clumps on the map.  In addition to the resources teams start with and mine, at every round each team receives { SPECS.TRICKLE_FUEL } fuel.</p>
                                    <p>Robots have knowledge of the full map at the beginning of the game (including resource depots), and can only see robots within their vision radius.</p>
                                    <He>Units Overview</He>
                                    <p>Unlike last year’s Battlecode game, each unit is controlled by its own process.  Each unit is initialized with a { SPECS.CHESS_INITIAL }ms chess clock, and receives { SPECS.CHESS_EXTRA }ms of additional computation each round.  When a unit is spawned, it is assigned a unique 32 bit integer ID, and always occupies a single tile. When the health of a unit is reduced to 0, the unit is immediately removed from the game.</p>
                                    <p>There are two types of units: robots and structures. Robots are mobile units that fight, move to adjacent squares, build factories, carry resources, or mine fuel and karbonite from the map. There are two types of structures: Castles and Churches.  Castles are immovable versions of Churches that cannot be created and carry special abilities.  Churches produce robots, and provide a depot for Pilgrims to deposit resources into the global economy.</p>
                                    <Hee>Castles</Hee>
                                    <p>Each team starts with 1-3 castles on the map, each with initial health { SPECS.UNITS[SPECS.CASTLE].STARTING_HP } and vision radius { SPECS.UNITS[SPECS.CASTLE].VISION_RADIUS}.  Castles have all the abilities of Churches, but cannot be built, and have greater health.  Castles also have unique communication abilities; not only can all units send messages to Castles for free (discussed in the Communication section), but Castles can also trade Karbonite and Fuel with opposing team castles.</p>
                                    <p>Each turn, a castle can offer a Barter to a castle of the opposing team.  Barters are offers to trade X Karbonite for Y Fuel (or vice versa).  Players can use this functionality to collaborate with the opposing team for mutual benefit.</p>
                                    <p>When all of a team’s castles are destroyed, the team is considered defeated.</p>
                                    <Hee>Churches</Hee>
                                    <p>Churches are structures with the ability to produce robots for their Karbonite and Fuel cost.  In any given turn a church can spawn a robot in any adjacent square, with that robot added to the end of the turn queue.  Robots adjacent to churches in their turn can deposit Fuel and Karbonite, adding those resources to the team’s global stores.</p>
                                    <p>Churches can be constructed by Pilgrims for { SPECS.UNITS[SPECS.CHURCH].CONSTRUCTION_KARBONITE } Karbonite and { SPECS.UNITS[SPECS.CHURCH].CONSTRUCTION_FUEL } Fuel, and have an initial starting health of { SPECS.UNITS[SPECS.CHURCH].STARTING_HP } and a vision radius of { SPECS.UNITS[SPECS.CHURCH].VISION_RADIUS}.</p>
                                    <Hee>Robots</Hee>
                                    <p>There are four classes of robots: Pilgrims, Crusaders, Prophets, and Preachers.  Pilgrims are scouting, mining, and building robots, while the other robots are only capable of combat and resource transportation.   Below is a summary of the robot types, with more description following.</p>
                                    <RobotTable />
                                    <p>Pilgrims are non-combat robots that can mine a single unit of Karbonite or Fuel and deliver them to Castles and Churches.  For each turn a Pilgrim mines a Karbonite depot, they receive { SPECS.KARBONITE_YIELD } Karbonite.  Similarly, for each turn a Pilgrim mines a Fuel depot they receive { SPECS.FUEL_YIELD } Fuel.  Pilgrims can also construct Churches.</p>
                                    <p>Crusaders are capable of shorter-range combat, Prophets are longer range, and Preachers deal AOE damage.</p>
                                    <p>Robots can move to or attack any square within their speed or attack radius, even if that terrain is technically unreachable using a smaller step size.  In each turn, a unit can only perform one physical action, including moving, attacking, depositing/giving, mining, trading, and building.</p>
                                    <He>Reclaim</He>
                                    <p>When units are destroyed they leave half of the Karbonite required to build them, in addition to any resources they may have been carrying, to the unit that destroyed them.  So, if the Pilgrim from the previous example were destroyed and was carrying 10 Fuel and 3 Karbonite, the attacker would now have an additional 10 Fuel and {3+SPECS.UNITS[SPECS.PILGRIM].CONSTRUCTION_KARBONITE/2} Karbonite.</p>
                                    <He>Communication</He>
                                    <p>Each unit on the board has its own process, and is sandboxed from other units.  To facilitate communication and global planning, each unit has two possible methods of communication.</p>
                                    <p>Radio is the primary method of communication usable by unit.  In any given turn, a unit can broadcast a {SPECS.COMMUNICATION_BITS} bit message to all units within squared radius X^2, consuming X^2 Fuel.  For example, a unit with id 1984 that wanted to broadcast a message with a squared radius of 10 squares would need to expend 10 Fuel.  On the next round, all units within that radius will see that the a unit with ID 1984 broadcasted the given message.  Units can radio broadcast simultaneously with all other actions.  Note that robots can see the unit ID that produced a broadcast, but not which team the unit belongs to.</p>
                                    <p>Units also have a direct channel to communicate an {SPECS.CASTLE_TALK_BITS} bit value to all their team’s Castles for free from any distance.  This can also be combined with any other action, including general radio communications.</p>
                                    <He>Turn Queue</He>
                                    <p>Battlecode Crusade games consist of up to {SPECS.MAX_ROUNDS} rounds, and each round consists of a turn for every unit on the board at that time.  This is acheived by cycling each round through a queue that consists of all units on the map.  This queue is initialized with each team’s Castles in alternating Red, Blue order.  Then, whenever a unit produces a new unit, that unit is added to the end of the turn queue as soon as the constructor unit’s turn ends.  A round consists of a full pass through the turn queue.</p>
                                </div>
                            </div>

                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Javascript Bot Reference</h4>
                                    <p className="category">Updated 1/7/19 7:00PM EST</p>
                                </div>
                                <div className="content">
                                    <p>Javascript is the primary language supported by Battlecode Crusade, and the target all other languages are compiled to, so it's a great choice to develop a bot in (especially for beginners).  Below is a bare minimum bot example:</p>
                                    <pre>{`import {BCAbstractRobot, SPECS} from 'battlecode';

class MyRobot extends BCAbstractRobot {
    turn() {

        return this.move(1,0);

    }
}

var robot = new MyRobot();`}</pre>
                                    <p>The main container of your bot code is the <code>MyRobot</code> class, which must be a subclass of <code>BCAbstractRobot</code>. <code>BCAbstractRobot</code> contains all sorts of useful methods that will make developing your bot easier.</p>
                                    <p>When your bot is spawned, a <code>MyRobot</code> object is created in its own global scope. For every turn, the <code>turn()</code> method of your class is called.  This is where the heart of your robot code lives. If you want the robot to perform an action, the <code>turn()</code> method should return it.</p>
                                    <p>Note that the same <code>MyRobot</code> class is used for all units. Some API methods will only be available for some units, and will throw an error if called by unallowed units.</p>
                                    <hr /><h6>State Information</h6><hr />
                                    <ul>
                                        <li><code>this.me</code>: The robot object (see below) for this robot.</li>
                                        <li><code>this.map</code>: The full map. Boolean grid where <code>true</code> indicates passable and <code>false</code> indicates impassable. </li>
                                        <li><code>this.karbonite_map</code>: The Karbonite map. Boolean grid where <code>true</code> indicates that Karbonite is present and <code>false</code> indicates that it is not. </li>
                                        <li><code>this.fuel_map</code>: The Fuel map. Boolean grid where <code>true</code> indicates that Fuel is present and <code>false</code> indicates that it is not. </li>
                                        <li><code>this.karbonite</code>: The global amount of Karbonite that the team possesses.</li>
                                        <li><code>this.fuel</code>: The global amount of Fuel that the team possesses.</li>
                                        <li><code>this.last_offer</code>: A 2 by 2 grid containing the last trade offers by both teams. <code>this.last_offer[{SPECS.RED}]</code> is the last offer made by RED and contains a list of two integers, where the first one is the amount of Karbonite and the second one is the amount of Fuel. Similarly, <code>this.last_offer[{SPECS.BLUE}]</code> is the last offer made by BLUE. For both offers, a positive amount signifies that the resource goes from RED to BLUE. Available for Castles (always <code>null</code> for other units).</li>
                                    </ul>
                                    <hr /><h6>The Robot Object</h6><hr />
                                    <p>In the following list, assume that <code>r</code> is a robot object (e.g., <code>r = this.me</code>). Note that some properties are only available under certain circumstances.</p>
                                    <ul>
                                        <li><code>r.id</code>: The id of the robot, which is an integer between 1 and {SPECS.MAX_ID}. Always available.</li>
                                        <li><code>r.unit</code>: The robot's unit type, where { SPECS.CASTLE } stands for Castle, { SPECS.CHURCH } stands for Church, { SPECS.PILGRIM} stands for Pilgrim, {SPECS.CRUSADER} stands for Crusader, {SPECS.PROPHET} stands for Prophet and {SPECS.PREACHER} stands for Preacher. Available if visible.</li>
                                        <li><code>r.health</code>: The health of the robot. Only available for <code>r = this.me</code>.</li>
                                        <li><code>r.team</code>: The team of the robot, where {SPECS.RED} stands for RED and {SPECS.BLUE} stands for BLUE. Available if visible. </li>
                                        <li><code>r.x</code>: The x position of the robot. Available if visible. </li>
                                        <li><code>r.y</code>: The y position of the robot. Available if visible. </li>
                                        <li><code>r.fuel</code>: The amount of Fuel that the robot carries. Only available for <code>r = this.me</code>.</li>
                                        <li><code>r.karbonite</code>: The amount of Karbonite that the robot carries. Only available for <code>r = this.me</code>.</li>
                                        <li><code>r.turn</code>: The turn count of the robot (initialiazed to 0, and incremented just before <code>turn()</code>). Always available.</li>
                                        <li><code>r.signal</code>: The signal of the robot. Available if radioable.</li>
                                        <li><code>r.signal_radius</code>: The signal radius of the robot. Available if radioable. </li>
                                        <li><code>r.castle_talk</code>: The castle talk message sent by the robot. Available if <code>this.me</code> is a Castle.</li>
                                    </ul>
                                    <p>Visible means that <code>r</code> is within <code>this.me</code>'s vision radius (particularly, <code>this.me</code> is always visible to itself). Radioable means that <code>this.me</code> is within <code>r</code>'s signal radius. </p>
                                    <hr /><h6>Actions</h6><hr />
                                    <p>The following is a list of methods that can be returned in <code>turn()</code>, to perform an action. Note that the action will only be performed if it is returned; thus, only one of these actions can be performed per turn. </p>
                                    <ul>
                                        <li><code>this.move(dx, dy)</code>: Move <code>dx</code> steps in the x direction, and <code>dy</code> steps in the y direction. Uses Fuel (depending on unit and distance). Available for Pilgrims, Crusaders, Prophets, Preachers. </li>
                                        <li><code>this.mine()</code>: Mine { SPECS.KARBONITE_YIELD } Karbonite or { SPECS.FUEL_YIELD } Fuel, if on a corresponding resource tile. Uses { SPECS.MINE_FUEL_COST } Fuel. Available for Pilgrims. </li>
                                        <li><code>this.give(dx, dy, karbonite, fuel)</code>: Give <code>karbonite</code> Karbonite and <code>fuel</code> Fuel to the robot in the tile that is <code>dx</code> steps in the x direction and <code>dy</code> steps in the y direction from <code>this.me</code>. A robot can only give to another robot that is in one of its 8 adjacent tiles, and cannot give more than it has. Uses 0 Fuel. Available for all units. </li>
                                        <li><code>this.attack(dx, dy)</code>: Attack the robot in the tile that is <code>dx</code> steps in the x direction and <code>dy</code> steps in the y direction from <code>this.me</code>. A robot can only attack another robot that is within its attack radius (depending on unit). Uses Fuel (depending on unit). Available for Crusaders, Prophets, Preachers. </li>
                                        <li><code>this.buildUnit(unit, dx, dy)</code>: Build a unit of the type <code>unit</code> in the tile that is <code>dx</code> steps in the x direction and <code>dy</code> steps in the y direction from <code>this.me</code>. Can only build in adjacent, empty and passable tiles. Uses Fuel and Karbonite (depending on the constructed unit). Available for Pilgrims, Castles, Churches. Pilgrims can only build Churches, and Castles and Churches can only build Pilgrims, Crusaders, Prophets and Preachers.</li>
                                        <li><code>this.proposeTrade(karbonite, fuel)</code>: Propose a trade with the other team. <code>karbonite</code> and <code>fuel</code> need to be integers. For example, for RED to make the offer "I give you 10 Karbonite if you give me 10 Fuel", the parameters would be <code>karbonite = 10</code> and <code>fuel = -10</code> (for BLUE, the signs are reversed). If the proposed trade is the same as the other team's <code>last_offer</code>, a trade is performed, after which the <code>last_offer</code> of both teams will be nullified. Available for Castles.</li> 
                                    </ul>
                                    <hr /><h6>Communication</h6><hr />
                                    <ul>
                                        <li><code>this.signal(value, sq_radius)</code>: Broadcast <code>value</code> to all robots within the squared radius <code>sq_radius</code>. Uses <code>sq_radius</code> Fuel. <code>value</code> should be an integer between <code>0</code> and <code>2^{SPECS.COMMUNICATION_BITS}-1</code> (inclusive). Can be called multiple times in one <code>turn()</code>; however, only the most recent signal will be used, while each signal will cost Fuel. </li>
                                        <li><code>this.castleTalk(value)</code>: Broadcast <code>value</code> to all Castles of the same team. Does not use Fuel. <code>value</code> should be an integer between <code>0</code> and <code>2^{SPECS.CASTLE_TALK_BITS}-1</code> (inclusive). Can be called multiple times in one <code>turn()</code>; however, only the most recent castle talk will be used. </li>
                                    </ul>
                                    <hr /><h6>Helper Methods</h6><hr />
                                    <ul>
                                        <li><code>this.log(message)</code>: Print a message to the command line.  You cannot use ordinary <code>console.log</code> in Battlecode for security reasons.</li>
                                        <li><code>this.getVisibleRobots()</code>: Returns a list containing all robots within <code>this.me</code>'s vision radius. For castles, robots of the same team not within the vision radius will also be included, to be able to read the <code>castle_talk</code> property. </li>
                                        <li><code>this.getVisibleRobotMap()</code>: Returns a 2d grid of integers the size of <code>this.map</code>. All tiles outside <code>this.me</code>'s vision radius will contain <code>-1</code>. All tiles within the vision will be <code>0</code> if empty, and will be a robot id if it contains a robot. </li>
                                        <li><code>this.getRobot(id)</code>: Returns a robot object with the given integer <code>id</code>.  Returns <code>null</code> if such a robot is not in your vision (for Castles, it also returns a robot object for all robots on <code>this.me</code>'s team that are not in the robot's vision, to access <code>castle_talk</code>).</li>
                                        <li><code>this.isVisible(robot)</code>: Returns <code>true</code> if the given robot object is visible.</li>
                                        <li><code>this.isRadioing(robot)</code>: Returns <code>true</code> if the given robot object is currently sending radio (signal).</li>
                                        <li><code>this.getPassableMap()</code>: Returns <code>this.map</code>. </li>
                                        <li><code>this.getKarboniteMap()</code>: Returns <code>this.karbonite_map</code>. </li>
                                        <li><code>this.getFuelMap()</code>: Returns <code>this.fuel_map</code>. </li>

                                    </ul>
                                </div>
                            </div>

                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Python Bot Reference</h4>
                                    <p className="category">Updated 1/7/19 7:00PM EST</p>
                                </div>
                                <div className="content">
                                    <p>Python is a great language choice for handling lists and numerical data.  Below is a bare minimum bot example in Python:</p>
                                    <pre>{`class MyRobot(BCAbstractRobot):
    def turn(self):
        return self.move(bc.NORTH)`}</pre>
                                    <p>RANDOM.RANDRANGE does not work. The main container of your bot code is the <code>MyRobot</code> class, which must be a subclass of <code>BCAbstractRobot</code>. <code>BCAbstractRobot</code> contains all sorts of useful methods that will make developing your bot easier.</p>
                                    <p>When your bot is spawned, a <code>MyRobot</code> object is created in its own global scope.  For every turn, the <code>turn()</code> method of your class is called.  This is where the heart of your robot code lives.  At the end of the <code>turn()</code> method, if you want to perform an action (move or attack), you must return <code>self.move(direction)</code> or <code>self.attack(direction)</code>, where <code>direction</code> can be <code>bc.NORTH</code>, <code>bc.SOUTHWEST</code>, or any similarly formatted direction.</p>
                                    <hr /><h6>API Reference</h6><hr />
                                    <p>There are a number of useful methods you can use to explore and impact the world around you as a bot.  We'll detail them here.</p>
                                    <ul>
                                        <li><code>self.me()</code>: Returns an dict containing details about your bot, including <code>.health</code>, <code>.id</code>, <code>.x</code>, <code>.y</code>, <code>.fuse</code>, <code>.signal</code>, and <code>.team</code>.</li>
                                        <li><code>self.log(message)</code>: Print a message to the command line.  You cannot use ordinary <code>print</code> in Battlehack for security reasons.</li>
                                        <li><code>self.signal(integer)</code>: Set your signal bits to a certain value 0 to 15 inclusive.</li>
                                        <li><code>self.get_robot(id)</code>: Returns a robot dict with the given integer ID.  Returns null if such a robot is not in your vision. This contains all the properties of <code>this.me()</code> except <code>.health</code>, assuming the gotten robot is not you.</li>
                                        <li><code>self.get_visible_robots()</code>: Returns a list of all robot dicts visible to you.</li>
                                        <li><code>self.get_visible_map()</code>: Returns a 7x7 2d int array of your robot's current vision, where a value of <code>bc.EMPTY</code> means there's nothing there, <code>bc.HOLE</code> means the square is impassable, and if the value is neither hole or empty, the ID of the robot occupying that space.</li>
                                        <li><code>self.get_relative_pos(dX,dY)</code>: A shortcut to get what's in the square <code>(dX,dY)</code> away.  Returns a robot dict if one is there, otherwise <code>bc.EMPTY</code> or <code>bc.HOLE</code>.</li>
                                        <li><code>self.get_in_direction(direction)</code>: Returns the output of <code>self.get_relative_pos</code> in the specified direction.</li>
                                        <li><code>self.move(direction)</code>: Returns an action to move in a given direction.</li>
                                        <li><code>self.attack(direction)</code>: Returns an action to attack in a given direction, dealing 2HP damage.</li>
                                        <li><code>self.fuse()</code>: Returns an action to explode in 3 rounds.  You cannot move or attack once you've lit your fuse.</li>
                                        <li><code>self.nexus(direction)</code>:  Point Nexus creation in a given direction.  Does not have to be returned, and can be performed in synchrony with another action.</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Java Bot Reference</h4>
                                    <p className="category">Updated 1/7/19 7:00PM EST</p>
                                </div>
                                <div className="content">
                                    <p>Below is a bare minimum Java bot example:</p>
                                    <pre>{`package robot;

public class MyRobot extends BCAbstractRobot {
    public Action turn() {
        return move(bc.NORTH);
    }
}`}</pre>
                                    <p>The main container of your bot code is the <code>MyRobot</code> class, which must be a subclass of <code>BCAbstractRobot</code>. <code>BCAbstractRobot</code> contains all sorts of useful methods that will make developing your bot easier.</p>
                                    <p>When your bot is spawned, a <code>MyRobot</code> object is created in its own global scope.  For every turn, the <code>turn()</code> method of your class is called.  This is where the heart of your robot code lives.  At the end of the <code>turn()</code> method, if you want to perform an action (move or attack), you must return <code>move(direction)</code> or <code>attack(direction)</code>, where <code>direction</code> can be <code>bc.NORTH</code>, <code>bc.SOUTHWEST</code>, or any similarly formatted direction.</p>
                                    <p>You cannot create new classes at the same level as <code>MyRobot</code>.  Instead, declare nested classes inside of the <code>MyRobot</code> class, as all of your code must live inside it.</p>
                                    <hr /><h6>API Reference</h6><hr />
                                    <p>There are a number of useful methods you can use to explore and impact the world around you as a bot.  We'll detail them here.</p>
                                    <ul>
                                        <li><code>Robot me()</code>: Returns a <code>Robot</code> object containing details about your bot, including <code>.health</code>, <code>.id</code>, <code>.x</code>, <code>.y</code>, <code>.fuse</code>, <code>.signal</code>, and <code>.team</code>.</li>
                                        <li><code>void log(String message)</code>: Print a message to the command line.  You cannot use ordinary <code>console.log</code> in Battlehack for security reasons.</li>
                                        <li><code>void signal(int signal)</code>: Set your signal bits to a certain value 0 to 15 inclusive.</li>
                                        <li><code>Robot getRobot(int id)</code>: Returns a <code>Robot</code> object with the given integer ID.  Returns null if such a robot is not in your vision.  Note that if the robot ID is not yours, the health will be censored.</li>
                                        <li><code>ArrayList&lt;Robot&gt; getVisibleRobots()</code>: Returns a list of all robot objects visible to you.</li>
                                        <li><code>int[][] getVisibleMap()</code>: Returns a 7x7 2d int array of your robot's current vision, where a value of <code>bc.EMPTY</code> means there's nothing there, <code>bc.HOLE</code> means the square is impassable, and if the value is neither hole or empty, the ID of the robot occupying that space.</li>
                                        <li><code>int getRelativePos(int dX, int dY)</code>: A shortcut to get what's in the square <code>(dX,dY)</code> away.  Returns an integer that is either a robot id, <code>bc.EMPTY</code> or <code>bc.HOLE</code>.</li>
                                        <li><code>int getInDirection(int direction)</code>: Returns the output of <code>getRelativePos</code> in the specified direction.</li>
                                        <li><code>Action move(int direction)</code>: Returns an action to move in a given direction.</li>
                                        <li><code>Action attack(int direction)</code>: Returns an action to attack in a given direction, dealing 2HP damage.</li>
                                        <li><code>Action fuse()</code>: Returns an action to explode in 3 rounds.  You cannot move or attack once you've lit your fuse.</li>
                                        <li><code>void nexus(direction)</code>:  Point Nexus creation in a given direction.  Does not have to be returned, and can be performed in synchrony with another action.</li>
                                    </ul>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Docs;
