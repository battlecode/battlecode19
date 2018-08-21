import React, { Component } from 'react';

class Docs extends Component {
    render() {
        return (
            <div className="content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-md-12">
                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Battlecode Nexus Game Spec</h4>
                                    <p className="category">Updated 8/8/17 2:00PM PST</p>
                                </div>
                                <div className="content">
                                    <p>In the distant future, almost all nature and technology have been wiped out by global catastrophe.  All that remains are two opposing factions of <i>microbots</i>, <span className="text-danger">red</span> and <span className="text-info">blue</span>, who live on  a wraparound grid randomly scattered with holes and obstacles.  Microbots start with 64HP, and are given a randomly generated integer ID at creation.</p>
                                    <p>In each turn a microbots can either move to or attack a nearby square, and communicate using up to 4 bits of signalling.  Microbots have limited vision; they can only see within a surrounding 7x7 region, and can only view the ID and signal bits of other microbots.</p>
                                    <p>Microbots can heal and reproduce through the joint formation of nexi.  If any 4 microbots of the same team are in the following formation, with empty corners:</p>
                                    <blockquote>
                                        <p style={{textAlign:'center'}}>X<br />X&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;X<br />X</p>
                                    </blockquote>
                                    <p>then a new microbot of that team will be created in the center square with 1HP.  If a microbot already exists in the spot, it’s health will be increased by 1HP.</p>
                                    <p>The game ends when either one team is totally annihilated, or 200 rounds have passed.  After 200 rounds, the team with greater total HP wins.  If both teams have equal HP after 200 rounds, the winner is determined by a coin flip.</p>
                                </div>
                            </div>

                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Javascript Bot Reference</h4>
                                    <p className="category">Updated 8/12/17 2:00PM PST</p>
                                </div>
                                <div className="content">
                                    <p>Javascript is the primary language supported by Battlehack West, and the target all other languages are compiled to, so it's a great choice to develop a bot in (especially for beginners).  Below is a bare minimum bot example:</p>
                                    <pre>{`class MyRobot extends BCAbstractRobot {
    turn() {
        return this.move(bc.NORTH);
    }
}`}</pre>
                                    <p>The main container of your bot code is the <code>MyRobot</code> class, which must be a subclass of <code>BCAbstractRobot</code>. <code>BCAbstractRobot</code> contains all sorts of useful methods that will make developing your bot easier.</p>
                                    <p>When your bot is spawned, a <code>MyRobot</code> object is created in its own global scope.  For every turn, the <code>turn()</code> method of your class is called.  This is where the heart of your robot code lives.  At the end of the <code>turn()</code> method, if you want to perform an action (move or attack), you must return <code>this.move(direction)</code> or <code>this.attack(direction)</code>, where <code>direction</code> can be <code>bc.NORTH</code>, <code>bc.SOUTHWEST</code>, or any similarly formatted direction.</p>
                                    <hr /><h6>API Reference</h6><hr />
                                    <p>There are a number of useful methods you can use to explore and impact the world around you as a bot.  We'll detail them here.</p>
                                    <ul>
                                        <li><code>this.me()</code>: Returns an object containing details about your bot, including <code>.health</code> and <code>.id</code>.</li>
                                        <li><code>this.log(message)</code>: Print a message to the command line.  You cannot use ordinary <code>console.log</code> in Battlehack for security reasons.</li>
                                        <li><code>this.signal(integer)</code>: Set your signal bits to a certain value 0 to 15 inclusive.</li>
                                        <li><code>this.getRobot(id)</code>: Returns a robot object with the given integer ID.  Returns null if such a robot is not in your vision.</li>
                                        <li><code>this.getVisibleRobots()</code>: Returns a list of all robot objects visible to you.</li>
                                        <li><code>this.getVisibleMap()</code>: Returns a 7x7 2d int array of your robot's current vision, where a value of <code>bc.EMPTY</code> means there's nothing there, <code>bc.HOLE</code> means the square is impassable, and if the value is neither hole or empty, the ID of the robot occupying that space.</li>
                                        <li><code>this.getRelativePos(dX,dY)</code>: A shortcut to get what's in the square <code>(dX,dY)</code> away.  Returns a robot object if one is there, otherwise <code>bc.EMPTY</code> or <code>bc.HOLE</code>.</li>
                                        <li><code>this.getInDirection(direction)</code>: Returns the output of <code>this.getRelativePos</code> in the specified direction.</li>
                                        <li><code>this.move(direction)</code>: Returns an action to move in a given direction.</li>
                                        <li><code>this.attack(direction)</code>: Returns an action to attack in a given direction.</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Python Bot Reference</h4>
                                    <p className="category">Updated 8/12/17 2:00PM PST</p>
                                </div>
                                <div className="content">
                                    <p>Python is a great language choice for handling lists and numerical data.  Below is a bare minimum bot example in Python:</p>
                                    <pre>{`class MyRobot(BCAbstractRobot):
    def turn(self):
        return self.move(bc.NORTH)`}</pre>
                                    <p>The main container of your bot code is the <code>MyRobot</code> class, which must be a subclass of <code>BCAbstractRobot</code>. <code>BCAbstractRobot</code> contains all sorts of useful methods that will make developing your bot easier.</p>
                                    <p>When your bot is spawned, a <code>MyRobot</code> object is created in its own global scope.  For every turn, the <code>turn()</code> method of your class is called.  This is where the heart of your robot code lives.  At the end of the <code>turn()</code> method, if you want to perform an action (move or attack), you must return <code>self.move(direction)</code> or <code>self.attack(direction)</code>, where <code>direction</code> can be <code>bc.NORTH</code>, <code>bc.SOUTHWEST</code>, or any similarly formatted direction.</p>
                                    <hr /><h6>API Reference</h6><hr />
                                    <p>There are a number of useful methods you can use to explore and impact the world around you as a bot.  We'll detail them here.</p>
                                    <ul>
                                        <li><code>self.me()</code>: Returns an dict containing details about your bot, including <code>.health</code> and <code>.id</code>.</li>
                                        <li><code>self.log(message)</code>: Print a message to the command line.  You cannot use ordinary <code>print</code> in Battlehack for security reasons.</li>
                                        <li><code>self.signal(integer)</code>: Set your signal bits to a certain value 0 to 15 inclusive.</li>
                                        <li><code>self.get_robot(id)</code>: Returns a robot dict with the given integer ID.  Returns null if such a robot is not in your vision.</li>
                                        <li><code>self.get_visible_robots()</code>: Returns a list of all robot dicts visible to you.</li>
                                        <li><code>self.get_visible_map()</code>: Returns a 7x7 2d int array of your robot's current vision, where a value of <code>bc.EMPTY</code> means there's nothing there, <code>bc.HOLE</code> means the square is impassable, and if the value is neither hole or empty, the ID of the robot occupying that space.</li>
                                        <li><code>self.get_relative_pos(dX,dY)</code>: A shortcut to get what's in the square <code>(dX,dY)</code> away.  Returns a robot dict if one is there, otherwise <code>bc.EMPTY</code> or <code>bc.HOLE</code>.</li>
                                        <li><code>self.get_in_direction(direction)</code>: Returns the output of <code>self.get_relative_pos</code> in the specified direction.</li>
                                        <li><code>self.move(direction)</code>: Returns an action to move in a given direction.</li>
                                        <li><code>self.attack(direction)</code>: Returns an action to attack in a given direction.</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Javas Bot Reference</h4>
                                    <p className="category">Updated 8/12/17 2:00PM PST</p>
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
                                        <li><code>Robot me()</code>: Returns a <code>Robot</code> object containing details about your bot, including <code>.health</code> and <code>.id</code>.</li>
                                        <li><code>void log(String message)</code>: Print a message to the command line.  You cannot use ordinary <code>console.log</code> in Battlehack for security reasons.</li>
                                        <li><code>void signal(int signal)</code>: Set your signal bits to a certain value 0 to 15 inclusive.</li>
                                        <li><code>Robot getRobot(int id)</code>: Returns a <code>Robot</code> object with the given integer ID.  Returns null if such a robot is not in your vision.  Note that if the robot ID is not yours, the team and health will be censored.</li>
                                        <li><code>ArrayList&lt;Robot&gt; getVisibleRobots()</code>: Returns a list of all robot objects visible to you.</li>
                                        <li><code>int[][] getVisibleMap()</code>: Returns a 7x7 2d int array of your robot's current vision, where a value of <code>bc.EMPTY</code> means there's nothing there, <code>bc.HOLE</code> means the square is impassable, and if the value is neither hole or empty, the ID of the robot occupying that space.</li>
                                        <li><code>int getRelativePos(int dX, int dY)</code>: A shortcut to get what's in the square <code>(dX,dY)</code> away.  Returns an integer that is either a robot id, <code>bc.EMPTY</code> or <code>bc.HOLE</code>.</li>
                                        <li><code>int getInDirection(int direction)</code>: Returns the output of <code>getRelativePos</code> in the specified direction.</li>
                                        <li><code>Action move(int direction)</code>: Returns an action to move in a given direction.</li>
                                        <li><code>Action attack(int direction)</code>: Returns an action to attack in a given direction.</li>
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