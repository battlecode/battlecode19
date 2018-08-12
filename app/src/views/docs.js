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
                                    <h4 className="title">Battlecode Nexus: Game Spec</h4>
                                    <p className="category">Updated 8/8/17 2:00PM PST</p>
                                </div>
                                <div className="content">
                                    <p>In the distant future, almost all nature and technology have been wiped out by global catastrophe.  All that remains are two opposing factions of <i>microbots</i>, <span className="text-danger">red</span> and <span className="text-info">blue</span>, who live on  a wraparound grid randomly scattered with holes and obstacles.  Microbots start with 64HP, and are given a randomly generated integer ID at creation.</p>
                                    <p>In each turn a microbots can either move to or attack a nearby square, and communicate using up to 4 bits of signalling.  Microbots have limited vision; they can only see within a surrounding 14x14 region, and can only view the ID and signal bits of other microbots.</p>
                                    <p>Microbots can heal and reproduce through the joint formation of nexi.  If any 4 microbots of the same team are in the following formation, with empty corners:</p>
                                    <blockquote>
                                        <p><center>X<br />X&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;X<br />X</center></p>
                                    </blockquote>
                                    <p>then a new microbot of that team will be created in the center square with 1HP.  If such a microbot already exists, it’s health will be increased by 1HP.  However, if a microbot of the opposing team is in the center square, all 4 microbots in the surrounding nexus will lose 1HP.</p>
                                    <p>The game ends when either one team is totally annihilated, or 200 rounds have passed.  After 200 rounds, the team with greater total HP wins.  If both teams have equal HP after 200 rounds, the winner is determined by a coin flip.</p>
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