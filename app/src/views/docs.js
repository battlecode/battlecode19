import React, { Component } from 'react';
import SPECS from 'bc19/specs';
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
                            <td>{unit.ATTACK_DAMAGE}HP {unit.DAMAGE_SPREAD!==0?"for " + unit.DAMAGE_SPREAD + " r^2":""}</td>
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
                                    <p>Game maps are procedurally generated, and are square 2d grids ranging between 32x32 and 64x64 tiles.  Every map is either horizontally or vertically symmetric, and the top left corner has the coordinates (0,0).   Each tile in the map is either passable or impassable rocky terrain, and each team starts with 1-3 Castles on the map, { SPECS.INITIAL_KARBONITE } Karbonite, and { SPECS.INITIAL_FUEL } Fuel.</p>
                                    <p>Passable tiles can have resource points on them which when mined by Pilgrims provide either Karbonite, which is used to construct units, or Fuel, which is used to run them.  Once mined, these resources can be transferred between units and deposited for global usage at Castles or Churches.  Before being deposited at a Castle or Church, resources are unrefined, and cannot be utilized.  Almost any action in Battlecode Crusade consumes either Karbonite or Fuel, all from the global refined stores.  Note that rather than being distributed evenly, Karbonite and Fuel depots are usually found in small discrete clumps on the map.  In addition to the resources teams start with and mine, at every round each team receives { SPECS.TRICKLE_FUEL } fuel.</p>
                                    <p>Robots have knowledge of the full map at the beginning of the game (including resource depots), and can only see robots within their vision radius.</p>
                                    <He>Units Overview</He>
                                    <p>Unlike last year’s Battlecode game, each unit is controlled by its own process.  Each unit is initialized with a { SPECS.CHESS_INITIAL }ms chess clock, and receives { SPECS.CHESS_EXTRA }ms of additional computation each round.  Each turn is additionally capped at {SPECS.TURN_MAX_TIME}ms, after which code will be stopped.  If a robot exceeds its chess clock, it cannot move until it has > 0 time in its clock.</p>
                                    <p>When a unit is spawned, it is assigned a unique 32 bit integer ID, and always occupies a single tile. When the health of a unit is reduced to 0, the unit is immediately removed from the game.</p>
                                    <p>There are two types of units: robots and structures. Robots are mobile units that fight, move, build factories, carry resources, or mine fuel and karbonite from the map. There are two types of structures: Castles and Churches.  Castles are like Churches that cannot be created and carry special abilities.  Churches produce robots, and provide a depot for Pilgrims to deposit resources into the global economy.</p>
                                    <Hee>Castles</Hee>
                                    <p>Each team starts with 1-3 castles on the map, each with initial health { SPECS.UNITS[SPECS.CASTLE].STARTING_HP } and vision radius { SPECS.UNITS[SPECS.CASTLE].VISION_RADIUS}.  Castles have all the abilities of Churches, but cannot be built, and have greater health.  Castles also have unique communication abilities; not only can all units send messages to Castles for free (discussed in the Communication section), but Castles can also trade Karbonite and Fuel with opposing team castles.</p>
                                    <p>Each turn, a castle can offer a Barter to a castle of the opposing team.  Barters are offers to trade X Karbonite for Y Fuel (or vice versa).  Players can use this functionality to collaborate with the opposing team for mutual benefit.</p>
                                    <p>When all of a team’s castles are destroyed, the team is considered defeated.</p>
                                    <Hee>Churches</Hee>
                                    <p>Churches are structures with the ability to produce robots for their Karbonite and Fuel cost.  In any given turn a church or castle can spawn a robot in any adjacent square (where adjacent is defined to include diagonals), with that robot added to the end of the turn queue.  Robots adjacent to churches and castles in their turn can deposit Fuel and Karbonite, adding those resources to the team’s global stores.</p>
                                    <p>Churches can be constructed by Pilgrims for { SPECS.UNITS[SPECS.CHURCH].CONSTRUCTION_KARBONITE } Karbonite and { SPECS.UNITS[SPECS.CHURCH].CONSTRUCTION_FUEL } Fuel, and have an initial starting health of { SPECS.UNITS[SPECS.CHURCH].STARTING_HP } and a vision radius of { SPECS.UNITS[SPECS.CHURCH].VISION_RADIUS}.</p>
                                    <Hee>Robots</Hee>
                                    <p>There are four classes of robots: Pilgrims, Crusaders, Prophets, and Preachers.  Pilgrims are scouting, mining, and building robots, while the other robots are only capable of combat and resource transportation.   Below is a summary of the robot types, with more description following.</p>
                                    <RobotTable />
                                    <p>Pilgrims are non-combat robots that can mine unrefined Karbonite or Fuel and deliver them to Castles and Churches.  For each turn a Pilgrim mines a Karbonite depot, they receive { SPECS.KARBONITE_YIELD } unrefined Karbonite.  Similarly, for each turn a Pilgrim mines a Fuel depot they receive { SPECS.FUEL_YIELD } unrefined Fuel.  Pilgrims can also construct Churches.</p>
                                    <p>Crusaders are capable of shorter-range combat, Prophets are longer range, and Preachers deal AOE damage.</p>
                                    <p>Robots can move to or attack any square within their speed or attack radius, even if that terrain is technically unreachable using a smaller step size.  In each turn, a unit can only perform one physical action, including moving, attacking, depositing/giving, mining, trading, and building.</p>
                                    <He>Reclaim</He>
                                    <p>When units are destroyed, the robot that destroyed them receives half of the Karbonite required to build the destroyed unit, in addition to any resources they may have been carrying, all divided by the <code>r^2</code> between the attacker and the target.  So, if a Pilgrim were destroyed by a Crusader with <code>dx,dy=(1,1)</code> and was carrying 10 Fuel and 3 Karbonite, the attacker would now have an additional 5 Fuel and {Math.floor((3+SPECS.UNITS[SPECS.PILGRIM].CONSTRUCTION_KARBONITE/2)/2)} Karbonite.</p>
                                    <He>Communication</He>
                                    <p>Each unit on the board has its own process, and is sandboxed from other units.  To facilitate communication and global planning, each unit has two possible methods of communication.</p>
                                    <p>Radio is the primary method of communication usable by unit.  In any given turn, a unit can broadcast a {SPECS.COMMUNICATION_BITS} bit message to all units within squared radius X^2, consuming X^2 Fuel.  For example, a unit with id 1984 that wanted to broadcast a message with a squared radius of 10 squares would need to expend 10 Fuel.  On the next round, all units within that radius will see that the a unit with ID 1984 broadcasted the given message.  Units can radio broadcast simultaneously with all other actions.  Note that robots can see the unit ID that produced a broadcast, but not which team the unit belongs to.</p>
                                    <p>Units also have a direct channel to communicate an {SPECS.CASTLE_TALK_BITS} bit value to all their team’s Castles for free from any distance.  This can also be combined with any other action, including general radio communications.</p>
                                    <He>Turn Queue</He>
                                    <p>Battlecode Crusade games consist of up to {SPECS.MAX_ROUNDS} rounds, and each round consists of a turn for every unit on the board at that time.  This is acheived by cycling each round through a queue that consists of all units on the map.  This queue is initialized with each team’s Castles in alternating Red, Blue order.  Then, whenever a unit produces a new unit, that unit is added to the end of the turn queue as soon as the constructor unit’s turn ends.  To rephrase, units built in a round will get a turn in the same round.  A round consists of a full pass through the turn queue.</p>
                                </div>
                            </div>

                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Installation and CLI usage</h4>
                                    <p className="category">Updated 1/7/19 7:00PM EST</p>
                                </div>
                                <div className="content">
                                    <p>This year, Battlecode will be run through the Node Package Manager (npm). Installation for npm varies from operating system to operating system, but generally achieved through the <a href='https://nodejs.org/en/'>Node Website</a>. If you are on a Mac, download Homebrew and install from there using <code>brew install node npm</code>.</p>
                                    <ol>
                                        <li>Install npm.</li>
                                        <li><code>npm install -g bc19</code>.</li>
                                        <li>Run or compile your code using <code>bc19run</code> or <code>bc19compile</code>. Note that the bot code needs to be in its own directory.  Example (using the <a href="https://github.com/npfoss/examplefuncsplayer"> examplefuncsplayer </a>): <code>bc19run -b bots/exampy -r bots/example_js --chi 1000</code>.</li>
                                        <li>Upload compiled code using <code>bc19upload</code>.  Make sure you've defined environment variables <code>BC_USERNAME</code> and <code>BC_PASSWORD</code>, which should be the credentials you use to access this site.</li>
                                    </ol>

                                    You must have internet access to compile Python and Java code.  Additionally, be sure to frequently update by running <code>npm install -g bc19</code>.  If you are not running the most recent distribution, replays will not render correctly.
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

var step = -1;

class MyRobot extends BCAbstractRobot {
    turn() {
        step++;

        if (this.me.unit === SPECS.CRUSADER) {
            // this.log("Crusader health: " + this.me.health);
            const choices = [[0,-1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
            const choice = choices[Math.floor(Math.random()*choices.length)]
            return this.move(...choice);
        }

        else if (this.me.unit === SPECS.CASTLE) {
            if (step % 10 === 0) {
                this.log("Building a crusader at " + (this.me.x+1) + ", " + (this.me.y+1));
                return this.buildUnit(SPECS.CRUSADER, 1, 1);
            } else {
                return // this.log("Castle health: " + this.me.health);
            }
        }

    }
}

var robot = new MyRobot();`}</pre>
                                    <p>The main container of your bot code is the <code>MyRobot</code> class, which must be a subclass of <code>BCAbstractRobot</code>. <code>BCAbstractRobot</code> contains all sorts of useful methods that will make developing your bot easier.</p>
                                    <p>When your bot is spawned, a <code>MyRobot</code> object is created in its own global scope. For every turn, the <code>turn()</code> method of your class is called.  This is where the heart of your robot code lives. If you want the robot to perform an action, the <code>turn()</code> method should return it.</p>
                                    <p>Note that the same <code>MyRobot</code> class is used for all units. Some API methods will only be available for some units, and will throw an error if called by unallowed units.</p>
                                    <p>You can change the name of the <code>MyRobot</code> class, as long as you update the <code>var robot = new MyRobot();</code> line.</p>
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
                                        <li><code>r.time</code>: The chess clock's value at the start of the turn, in ms.  Only available if <code>r == this.me</code>.</li>
                                        <li><code>r.unit</code>: The robot's unit type, where { SPECS.CASTLE } stands for Castle, { SPECS.CHURCH } stands for Church, { SPECS.PILGRIM} stands for Pilgrim, {SPECS.CRUSADER} stands for Crusader, {SPECS.PROPHET} stands for Prophet and {SPECS.PREACHER} stands for Preacher. Available if visible.</li>
                                        <li><code>r.health</code>: The health of the robot. Only available for <code>r = this.me</code>.</li>
                                        <li><code>r.team</code>: The team of the robot, where {SPECS.RED} stands for RED and {SPECS.BLUE} stands for BLUE. Available if visible, or you are a castle. </li>
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
                                        <li><code>this.give(dx, dy, karbonite, fuel)</code>: Give <code>karbonite</code> Karbonite and <code>fuel</code> Fuel to the robot in the tile that is <code>dx</code> steps in the x direction and <code>dy</code> steps in the y direction from <code>this.me</code>. A robot can only give to another robot that is in one of its 8 adjacent tiles, and cannot give more than it has. Uses 0 Fuel. Available for all robots.  If a unit tries to give a robot more than its capacity, the excess is loss to the void.</li>
                                        <li><code>this.attack(dx, dy)</code>: Attack the robot in the tile that is <code>dx</code> steps in the x direction and <code>dy</code> steps in the y direction from <code>this.me</code>. A robot can only attack another robot that is within its attack radius (depending on unit). Uses Fuel (depending on unit). Available for Crusaders, Prophets, Preachers. </li>
                                        <li><code>this.buildUnit(unit, dx, dy)</code>: Build a unit of the type <code>unit</code> (integer, see <code>r.unit</code>) in the tile that is <code>dx</code> steps in the x direction and <code>dy</code> steps in the y direction from <code>this.me</code>. Can only build in adjacent, empty and passable tiles. Uses Fuel and Karbonite (depending on the constructed unit). Available for Pilgrims, Castles, Churches. Pilgrims can only build Churches, and Castles and Churches can only build Pilgrims, Crusaders, Prophets and Preachers.</li>
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
                                        <li><code>this.getVisibleRobots()</code>: Returns a list containing all robots within <code>this.me</code>'s vision radius and all robots whose radio broadcasts can be heard (accessed via <code>other_r.signal</code>). For castles, robots of the same team not within the vision radius will also be included, to be able to read the <code>castle_talk</code> property. </li>
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
                                    <p>Below is a bare minimum bot example in Python:</p>
                                    <pre>{`from battlecode import BCAbstractRobot, SPECS
import battlecode as bc
import random

__pragma__('iconv')
__pragma__('tconv')
#__pragma__('opov')

# don't try to use global variables!!
class MyRobot(BCAbstractRobot):
    step = -1

    def turn(self):
        self.step += 1
        self.log("START TURN " + self.step)
        if self.me['unit'] == SPECS['CRUSADER']:
            self.log("Crusader health: " + str(self.me['health']))
            # The directions: North, NorthEast, East, SouthEast, South, SouthWest, West, NorthWest
            choices = [(0,-1), (1, -1), (1, 0), (1, 1), (0, 1), (-1, 1), (-1, 0), (-1, -1)]
            choice = random.choice(choices)
            self.log('TRYING TO MOVE IN DIRECTION ' + str(choice))
            return self.move(*choice)

        elif self.me['unit'] == SPECS['CASTLE']:
            if self.step < 10:
                self.log("Building a crusader at " + str(self.me['x']+1) + ", " + str(self.me['y']+1))
                return self.build_unit(SPECS['CRUSADER'], 1, 1)

            else:
                self.log("Castle health: " + self.me['health'])

robot = MyRobot()
`}</pre>
                                    <p>The main container of your bot code is the <code>MyRobot</code> class, which must be a subclass of <code>BCAbstractRobot</code>. <code>BCAbstractRobot</code> contains all sorts of useful methods that will make developing your bot easier.</p>
                                    <p>When your bot is spawned, a <code>MyRobot</code> object is created in its own global scope. For every turn, the <code>turn()</code> method of your class is called.  This is where the heart of your robot code lives. If you want the robot to perform an action, the <code>turn()</code> method should return it.</p>
                                    <p>Note that the same <code>MyRobot</code> class is used for all units. Some API methods will only be available for some units, and will throw an error if called by unallowed units.</p>
                                    <p>You can change the name of the <code>MyRobot</code> class, as long as you update the <code>robot = MyRobot()</code> line.</p>
                                    <p>Python is compiled into Javascript before running games, using <a href='https://www.transcrypt.org/'>Transcrypt</a>. This introduces some unexpected bugs. Known bugs are listed below. </p>
                                    <hr /><h6>State Information</h6><hr />
                                    <ul>
                                        <li><code>self.me</code>: The robot object (see below) for this robot.</li>
                                        <li><code>self.map</code>: The full map. Boolean grid where <code>True</code> indicates passable and <code>False</code> indicates impassable. </li>
                                        <li><code>self.karbonite_map</code>: The Karbonite map. Boolean grid where <code>True</code> indicates that Karbonite is present and <code>False</code> indicates that it is not. </li>
                                        <li><code>self.fuel_map</code>: The Fuel map. Boolean grid where <code>True</code> indicates that Fuel is present and <code>False</code> indicates that it is not. </li>
                                        <li><code>self.karbonite</code>: The global amount of Karbonite that the team possesses.</li>
                                        <li><code>self.fuel</code>: The global amount of Fuel that the team possesses.</li>
                                        <li><code>self.last_offer</code>: A 2 by 2 grid containing the last trade offers by both teams. <code>self.last_offer[{SPECS.RED}]</code> is the last offer made by RED and contains a list of two integers, where the first one is the amount of Karbonite and the second one is the amount of Fuel. Similarly, <code>self.last_offer[{SPECS.BLUE}]</code> is the last offer made by BLUE. For both offers, a positive amount signifies that the resource goes from RED to BLUE. Available for Castles (always <code>None</code> for other units).</li>
                                    </ul>
                                    <hr /><h6>The Robot Object</h6><hr />
                                    <p>In the following list, assume that <code>r</code> is a robot object (e.g., <code>r = self.me</code>). Note that some properties are only available under certain circumstances.</p>
                                    <ul>
                                        <li><code>r.id</code>: The id of the robot, which is an integer between 1 and {SPECS.MAX_ID}. Always available.</li>
                                        <li><code>r.time</code>: The chess clock's value at the start of the turn, in ms.  Only available if <code>r == self.me</code>.</li>
                                        <li><code>r.unit</code>: The robot's unit type, where { SPECS.CASTLE } stands for Castle, { SPECS.CHURCH } stands for Church, { SPECS.PILGRIM} stands for Pilgrim, {SPECS.CRUSADER} stands for Crusader, {SPECS.PROPHET} stands for Prophet and {SPECS.PREACHER} stands for Preacher. Available if visible.</li>
                                        <li><code>r.health</code>: The health of the robot. Only available for <code>r = self.me</code>.</li>
                                        <li><code>r.team</code>: The team of the robot, where {SPECS.RED} stands for RED and {SPECS.BLUE} stands for BLUE. Available if visible, or you are a castle. </li>
                                        <li><code>r.x</code>: The x position of the robot. Available if visible. </li>
                                        <li><code>r.y</code>: The y position of the robot. Available if visible. </li>
                                        <li><code>r.fuel</code>: The amount of Fuel that the robot carries. Only available for <code>r = self.me</code>.</li>
                                        <li><code>r.karbonite</code>: The amount of Karbonite that the robot carries. Only available for <code>r = self.me</code>.</li>
                                        <li><code>r.turn</code>: The turn count of the robot (initialiazed to 0, and incremented just before <code>turn()</code>). Always available.</li>
                                        <li><code>r.signal</code>: The signal of the robot. Available if radioable.</li>
                                        <li><code>r.signal_radius</code>: The signal radius of the robot. Available if radioable. </li>
                                        <li><code>r.castle_talk</code>: The castle talk message sent by the robot. Available if <code>self.me</code> is a Castle.</li>
                                    </ul>
                                    <p>Visible means that <code>r</code> is within <code>self.me</code>'s vision radius (particularly, <code>self.me</code> is always visible to itself). Radioable means that <code>self.me</code> is within <code>r</code>'s signal radius. </p>
                                    <hr /><h6>Actions</h6><hr />
                                    <p>The following is a list of methods that can be returned in <code>turn()</code>, to perform an action. Note that the action will only be performed if it is returned; thus, only one of these actions can be performed per turn. </p>
                                    <ul>
                                        <li><code>self.move(dx, dy)</code>: Move <code>dx</code> steps in the x direction, and <code>dy</code> steps in the y direction. Uses Fuel (depending on unit and distance). Available for Pilgrims, Crusaders, Prophets, Preachers. </li>
                                        <li><code>self.mine()</code>: Mine { SPECS.KARBONITE_YIELD } Karbonite or { SPECS.FUEL_YIELD } Fuel, if on a corresponding resource tile. Uses { SPECS.MINE_FUEL_COST } Fuel. Available for Pilgrims. </li>
                                        <li><code>self.give(dx, dy, karbonite, fuel)</code>: Give <code>karbonite</code> Karbonite and <code>fuel</code> Fuel to the robot in the tile that is <code>dx</code> steps in the x direction and <code>dy</code> steps in the y direction from <code>self.me</code>. A robot can only give to another robot that is in one of its 8 adjacent tiles, and cannot give more than it has. Uses 0 Fuel. Available for all robots.  If a unit tries to give a robot more than its capacity, the excess is loss to the void. </li>
                                        <li><code>self.attack(dx, dy)</code>: Attack the robot in the tile that is <code>dx</code> steps in the x direction and <code>dy</code> steps in the y direction from <code>self.me</code>. A robot can only attack another robot that is within its attack radius (depending on unit). Uses Fuel (depending on unit). Available for Crusaders, Prophets, Preachers. </li>
                                        <li><code>self.build_unit(unit, dx, dy)</code>: Build a unit of the type <code>unit</code> (integer, see <code>r.unit</code>) in the tile that is <code>dx</code> steps in the x direction and <code>dy</code> steps in the y direction from <code>self.me</code>. Can only build in adjacent, empty and passable tiles. Uses Fuel and Karbonite (depending on the constructed unit). Available for Pilgrims, Castles, Churches. Pilgrims can only build Churches, and Castles and Churches can only build Pilgrims, Crusaders, Prophets and Preachers.</li>
                                        <li><code>self.propose_trade(karbonite, fuel)</code>: Propose a trade with the other team. <code>karbonite</code> and <code>fuel</code> need to be integers. For example, for RED to make the offer "I give you 10 Karbonite if you give me 10 Fuel", the parameters would be <code>karbonite = 10</code> and <code>fuel = -10</code> (for BLUE, the signs are reversed). If the proposed trade is the same as the other team's <code>last_offer</code>, a trade is performed, after which the <code>last_offer</code> of both teams will be nullified. Available for Castles.</li> 
                                    </ul>
                                    <hr /><h6>Communication</h6><hr />
                                    <ul>
                                        <li><code>self.signal(value, sq_radius)</code>: Broadcast <code>value</code> to all robots within the squared radius <code>sq_radius</code>. Uses <code>sq_radius</code> Fuel. <code>value</code> should be an integer between <code>0</code> and <code>2^{SPECS.COMMUNICATION_BITS}-1</code> (inclusive). Can be called multiple times in one <code>turn()</code>; however, only the most recent signal will be used, while each signal will cost Fuel. </li>
                                        <li><code>self.castle_talk(value)</code>: Broadcast <code>value</code> to all Castles of the same team. Does not use Fuel. <code>value</code> should be an integer between <code>0</code> and <code>2^{SPECS.CASTLE_TALK_BITS}-1</code> (inclusive). Can be called multiple times in one <code>turn()</code>; however, only the most recent castle talk will be used. </li>
                                    </ul>
                                    <hr /><h6>Helper Methods</h6><hr />
                                    <ul>
                                        <li><code>self.log(message)</code>: Print a message to the command line.  You cannot use ordinary <code>print</code> in Battlecode for security reasons.</li>
                                        <li><code>self.get_visible_robots()</code>: Returns a list containing all robots within <code>self.me</code>'s vision radius and all robots whose radio broadcasts can be heard (accessed via <code>other_r.signal</code>). For castles, robots of the same team not within the vision radius will also be included, to be able to read the <code>castle_talk</code> property. </li>
                                        <li><code>self.get_visible_robot_map()</code>: Returns a 2d grid of integers the size of <code>self.map</code>. All tiles outside <code>self.me</code>'s vision radius will contain <code>-1</code>. All tiles within the vision will be <code>0</code> if empty, and will be a robot id if it contains a robot. </li>
                                        <li><code>self.get_robot(id)</code>: Returns a robot object with the given integer <code>id</code>.  Returns <code>None</code> if such a robot is not in your vision (for Castles, it also returns a robot object for all robots on <code>self.me</code>'s team that are not in the robot's vision, to access <code>castle_talk</code>).</li>
                                        <li><code>self.is_visible(robot)</code>: Returns <code>True</code> if the given robot object is visible.</li>
                                        <li><code>self.is_radioing(robot)</code>: Returns <code>True</code> if the given robot object is currently sending radio (signal).</li>
                                        <li><code>self.get_passable_map()</code>: Returns <code>self.map</code>. </li>
                                        <li><code>self.get_karbonite_map()</code>: Returns <code>self.karbonite_map</code>. </li>
                                        <li><code>self.get_fuel_map()</code>: Returns <code>self.fuel_map</code>. </li>
                                    </ul>
                                    <hr /><h6>Known Bugs</h6><hr />
                                    <ul>
                                        <li><code>random.randrange</code> does not work</li>
                                        <li>Global variables do not work.</li>
                                        <li>Imports don't work on the online IDE.</li>
                                        <li><code>type()</code> does not work.</li>
                                        <li>Checking if lists or tuples are present in lists or sets using <code>in</code> does not work.</li>
                                        <li>Reversing a list using <code>list[::-1]</code> does not work.</li>
                                        <li>The <code>collections</code> package is not supported.</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Java Bot Reference</h4>
                                    <p className="category">Updated 1/7/19 7:00PM EST</p>
                                </div>
                                <div className="content">
                                    <p>Below is a bare minimum bot example in Java:</p>
                                    <pre>{`package bc19;

public class MyRobot extends BCAbstractRobot {

    public Action turn() {

        return move(1,0);

    }
}`}</pre>
                                    <p>The main container of your bot code is the <code>MyRobot</code> class, which must extend <code>BCAbstractRobot</code>. <code>BCAbstractRobot</code> contains all sorts of useful methods that will make developing your bot easier.</p>
                                    <p>When your bot is spawned, a <code>MyRobot</code> object is created in its own global scope. For every turn, the <code>turn()</code> method of your class is called.  This is where the heart of your robot code lives. If you want the robot to perform an action, the <code>turn()</code> method should return it.</p>
                                    <p>Note that the same <code>MyRobot</code> class is used for all units. Some API methods will only be available for some units, and will throw an error if called by unallowed units.</p>
                                    <p>You cannot change the name of the <code>MyRobot</code> class. </p>
                                    <p>Java is compiled into Javascript before running games. This introduces some unexpected bugs. Known bugs are listed below.</p>
                                    <hr /><h6>State Information</h6><hr />
                                    <ul>
                                        <li><code>Robot me</code>: The robot object (see below) for this robot.</li>
                                        <li><code>boolean[][] map</code>: The full map. Boolean grid where <code>true</code> indicates passable and <code>false</code> indicates impassable. </li>
                                        <li><code>boolean[][] karboniteMap</code>: The Karbonite map. Boolean grid where <code>true</code> indicates that Karbonite is present and <code>false</code> indicates that it is not. </li>
                                        <li><code>boolean[][] fuelMap</code>: The Fuel map. Boolean grid where <code>true</code> indicates that Fuel is present and <code>false</code> indicates that it is not. </li>
                                        <li><code>int karbonite</code>: The global amount of Karbonite that the team possesses.</li>
                                        <li><code>int fuel</code>: The global amount of Fuel that the team possesses.</li>
                                        <li><code>int[][] lastOffer</code>: A 2 by 2 grid containing the last trade offers by both teams. <code>lastOffer[{SPECS.RED}]</code> is the last offer made by RED and contains a list of two integers, where the first one is the amount of Karbonite and the second one is the amount of Fuel. Similarly, <code>lastOffer[{SPECS.BLUE}]</code> is the last offer made by BLUE. For both offers, a positive amount signifies that the resource goes from RED to BLUE. Available for Castles (always <code>null</code> for other units).</li>
                                    </ul>
                                    <hr /><h6>The Robot Object</h6><hr />
                                    <p>In the following list, assume that <code>r</code> is a robot object (e.g., <code>r = me</code>). Note that some properties are only available under certain circumstances.</p>
                                    <ul>
                                        <li><code>int r.id</code>: The id of the robot, which is an integer between 1 and {SPECS.MAX_ID}. Always available.</li>
                                        <li><code>r.time</code>: The chess clock's value at the start of the turn, in ms.  Only available if <code>r == me</code>.</li>
                                        <li><code>int r.unit</code>: The robot's unit type, where { SPECS.CASTLE } stands for Castle, { SPECS.CHURCH } stands for Church, { SPECS.PILGRIM} stands for Pilgrim, {SPECS.CRUSADER} stands for Crusader, {SPECS.PROPHET} stands for Prophet and {SPECS.PREACHER} stands for Preacher. Available if visible.</li>
                                        <li><code>int r.health</code>: The health of the robot. Only available for <code>r = me</code>.</li>
                                        <li><code>int r.team</code>: The team of the robot, where {SPECS.RED} stands for RED and {SPECS.BLUE} stands for BLUE. Available if visible, or you are a castle. </li>
                                        <li><code>int r.x</code>: The x position of the robot. Available if visible. </li>
                                        <li><code>int r.y</code>: The y position of the robot. Available if visible. </li>
                                        <li><code>int r.fuel</code>: The amount of Fuel that the robot carries. Only available for <code>r = me</code>.</li>
                                        <li><code>int r.karbonite</code>: The amount of Karbonite that the robot carries. Only available for <code>r = me</code>.</li>
                                        <li><code>int r.turn</code>: The turn count of the robot (initialiazed to 0, and incremented just before <code>turn()</code>). Always available.</li>
                                        <li><code>int r.signal</code>: The signal of the robot. Available if radioable.</li>
                                        <li><code>int r.signalRadius</code>: The signal radius of the robot. Available if radioable. </li>
                                        <li><code>int r.castleTalk</code>: The castle talk message sent by the robot. Available if <code>me</code> is a Castle.</li>
                                    </ul>
                                    <p>Visible means that <code>r</code> is within <code>me</code>'s vision radius (particularly, <code>me</code> is always visible to itself). Radioable means that <code>me</code> is within <code>r</code>'s signal radius. </p>
                                    <hr /><h6>Actions</h6><hr />
                                    <p>The following is a list of methods that can be returned in <code>turn()</code>, to perform an action. Note that the action will only be performed if it is returned; thus, only one of these actions can be performed per turn. </p>
                                    <ul>
                                        <li><code>MoveAction move(int dx, int dy)</code>: Move <code>dx</code> steps in the x direction, and <code>dy</code> steps in the y direction. Uses Fuel (depending on unit and distance). Available for Pilgrims, Crusaders, Prophets, Preachers. </li>
                                        <li><code>MineAction mine()</code>: Mine { SPECS.KARBONITE_YIELD } Karbonite or { SPECS.FUEL_YIELD } Fuel, if on a corresponding resource tile. Uses { SPECS.MINE_FUEL_COST } Fuel. Available for Pilgrims. </li>
                                        <li><code>GiveAction give(int dx, int dy, int karbonite, int fuel)</code>: Give <code>karbonite</code> Karbonite and <code>fuel</code> Fuel to the robot in the tile that is <code>dx</code> steps in the x direction and <code>dy</code> steps in the y direction from <code>me</code>. A robot can only give to another robot that is in one of its 8 adjacent tiles, and cannot give more than it has. Uses 0 Fuel. Available for all robots.   If a unit tries to give a robot more than its capacity, the excess is loss to the void.</li>
                                        <li><code>AttackAction attack(int dx, int dy)</code>: Attack the robot in the tile that is <code>dx</code> steps in the x direction and <code>dy</code> steps in the y direction from <code>me</code>. A robot can only attack another robot that is within its attack radius (depending on unit). Uses Fuel (depending on unit). Available for Crusaders, Prophets, Preachers. </li>
                                        <li><code>BuildAction buildUnit(int unit, int dx, int dy)</code>: Build a unit of the type <code>unit</code> (see <code>r.unit</code>) in the tile that is <code>dx</code> steps in the x direction and <code>dy</code> steps in the y direction from <code>me</code>. Can only build in adjacent, empty and passable tiles. Uses Fuel and Karbonite (depending on the constructed unit). Available for Pilgrims, Castles, Churches. Pilgrims can only build Churches, and Castles and Churches can only build Pilgrims, Crusaders, Prophets and Preachers.</li>
                                        <li><code>TradeAction proposeTrade(int karbonite, int fuel)</code>: Propose a trade with the other team. <code>karbonite</code> and <code>fuel</code> need to be integers. For example, for RED to make the offer "I give you 10 Karbonite if you give me 10 Fuel", the parameters would be <code>karbonite = 10</code> and <code>fuel = -10</code> (for BLUE, the signs are reversed). If the proposed trade is the same as the other team's <code>last_offer</code>, a trade is performed, after which the <code>last_offer</code> of both teams will be nullified. Available for Castles.</li> 
                                    </ul>
                                    <hr /><h6>Communication</h6><hr />
                                    <ul>
                                        <li><code>void signal(int value, int sq_radius)</code>: Broadcast <code>value</code> to all robots within the squared radius <code>sq_radius</code>. Uses <code>sq_radius</code> Fuel. <code>value</code> should be an integer between <code>0</code> and <code>2^{SPECS.COMMUNICATION_BITS}-1</code> (inclusive). Can be called multiple times in one <code>turn()</code>; however, only the most recent signal will be used, while each signal will cost Fuel. </li>
                                        <li><code>void castleTalk(int value)</code>: Broadcast <code>value</code> to all Castles of the same team. Does not use Fuel. <code>value</code> should be an integer between <code>0</code> and <code>2^{SPECS.CASTLE_TALK_BITS}-1</code> (inclusive). Can be called multiple times in one <code>turn()</code>; however, only the most recent castle talk will be used. </li>
                                    </ul>
                                    <hr /><h6>Helper Methods</h6><hr />
                                    <ul>
                                        <li><code>void log(String message)</code>: Print a message to the command line.  You cannot use ordinary <code>System.out.print</code> in Battlecode for security reasons.</li>
                                        <li><code>Robot[] getVisibleRobots()</code>: Returns a list containing all robots within <code>me</code>'s vision radius and all robots whose radio broadcasts can be heard (accessed via <code>other_r.signal</code>). For castles, robots of the same team not within the vision radius will also be included, to be able to read the <code>castle_talk</code> property. </li>
                                        <li><code>int[][] getVisibleRobotMap()</code>: Returns a 2d grid of integers the size of <code>map</code>. All tiles outside <code>me</code>'s vision radius will contain <code>-1</code>. All tiles within the vision will be <code>0</code> if empty, and will be a robot id if it contains a robot. </li>
                                        <li><code>Robot getRobot(id)</code>: Returns a robot object with the given integer <code>id</code>.  Returns <code>null</code> if such a robot is not in your vision (for Castles, it also returns a robot object for all robots on <code>me</code>'s team that are not in the robot's vision, to access <code>castle_talk</code>).</li>
                                        <li><code>boolean isVisible(Robot robot)</code>: Returns <code>true</code> if the given robot object is visible.</li>
                                        <li><code>boolean isRadioing(Robot robot)</code>: Returns <code>true</code> if the given robot object is currently sending radio (signal).</li>
                                        <li><code>boolean[][] getPassableMap()</code>: Returns <code>map</code>. </li>
                                        <li><code>boolean[][] getKarboniteMap()</code>: Returns <code>karboniteMap</code>. </li>
                                        <li><code>boolean[][] getFuelMap()</code>: Returns <code>fuelMap</code>. </li>

                                    </ul>
                                    <hr /><h6>Known Bugs</h6><hr />
                                    <ul>
                                        <li><code>System.nanoTime</code> does not work.</li>
                                        <li><code>Java.util.Random</code> does not work. Use <code>Math.random()</code> instead.</li>
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
