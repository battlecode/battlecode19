import React, { Component } from 'react';
import $ from 'jquery';
import Api from '../api';
import { NavLink } from 'react-router-dom';


class UpdateCard extends Component {
    constructor() {
        super();
        this.state = {'update_date': new Date()}; 
    }

    timeSince() {
        var seconds = Math.floor((new Date() - this.state.update_date) / 1000);

        var interval = Math.floor(seconds / 86400);
        if (interval > 1) return "Updated " + interval + " days ago.";
        interval = Math.floor(seconds / 3600);
        if (interval > 1) return "Updated " + interval + " hours ago.";
        interval = Math.floor(seconds / 60);
        if (interval > 1) return "Updated " + interval + " minutes ago.";
        //if (seconds <= 15) return "Just updated." 
        return "Updated " + Math.floor(seconds) + " seconds ago.";
    }
}

class PerfCard extends UpdateCard {
    componentDidMount() {
        $().ready(function() {
            Api.getTeamMuHistory(function(perf) {
                var dataSales = {'series':[perf,perf], 'labels':[]};
                for (var i=perf.length-1; i>=0; i--)
                    dataSales.labels.push(i===0 ? "Now" : i + "hr ago");

                window.Chartist.Line('#mu_chart', dataSales, {
                    low: 0,
                    height: "245px",
                    axisX: { showGrid: false, },
                    lineSmooth: window.Chartist.Interpolation.simple({
                        divisor: 3
                    }), showLine: true,
                    showPoint: false,
                }, [['screen and (max-width: 640px)', {
                    axisX: {
                        labelInterpolationFnc: v => v[0]
                    }
                }]]);
            });
        });
    }

    render() {
        return (
            <div className="card">
                <div className="header">
                    <h4 className="title">Performance</h4>
                    <p className="category">Skill estimation over time.</p>
                </div>
                <div className="content">
                    <div id="mu_chart" className="ct-chart" />
                    <div className="footer">
                        <hr />
                        <div className="stats">
                            <i className="fa fa-history" /> { this.timeSince() }
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

class StatCard extends UpdateCard {
    componentDidMount() {
        $().ready(function() {
            Api.getTeamWinStats(function(stats) {
                window.Chartist.Pie('#stat_chart', {
                    labels: stats.map(p => p+"%"),
                    series: stats
                }); 
            });
        });
    }

    render() {
        return (
            <div className="card">
                <div className="header">
                    <h4 className="title">Match Statistics</h4>
                    <p className="category">Wins, losses, and ties.</p>
                </div>
                <div className="content">
                    <div id="stat_chart" className="ct-chart ct-perfect-fourth" />
                    <div className="footer">
                        <div className="legend">
                            <i className="fa fa-circle text-info" /> Win
                            <i className="fa fa-circle text-danger" /> Loss
                            <i className="fa fa-circle text-warning" /> Tie
                        </div>
                        <hr />
                        <div className="stats">
                            <i className="fa fa-clock-o" /> { this.timeSince() }
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

class DateCard extends UpdateCard {
    constructor() {
        super();
        this.state.dates = [];
    }

    componentDidMount() {
        Api.getUpcomingDates(function(dates) {
            this.setState({ dates: dates });
        }.bind(this));
    }

    render() {
        return (
            <div className="card ">
                <div className="header">
                    <h4 className="title">Upcoming Dates</h4>
                    <p className="category">Deadlines, milestones, and more.</p>
                </div>
                <div className="content">
                    <div className="table-full-width">
                        <table className="table">
                            <tbody>
                                { this.state.dates.map(date => <tr key={ date.id }>
                                <td>{ date.date }</td>
                                <td>{ date.data }</td>
                                </tr> )}
                            </tbody>
                        </table>
                    </div>
                    <div className="footer">
                        <hr />
                        <div className="stats">
                            <i className="fa fa-history" /> { this.timeSince() }
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

class Home extends Component {
    constructor() {
        super();
        this.state = {on_team:null};
    }

    componentDidMount() {
        Api.getUserTeam(function(e) {
            this.setState({on_team:(e !== null)});
        }.bind(this));
    }

    render() {
        if (this.state.on_team) return (
            <div className="content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-md-12">
                            <PerfCard />
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-6">
                            <StatCard />
                        </div>
                        <div className="col-md-6">
                            <DateCard />
                        </div>
                    </div>
                </div>
            </div>
        ); else if (this.state.on_team === false) return (
            <div className="content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-md-12">
                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Welcome to Battlecode 2019: Oceana!</h4>
                                </div>
                                <div className="content">
                                    <div className="typo-line">
                                        <p>To compete in Battlecode, you must be on a team.  To join or create a team, simply click the <NavLink to="/team">Team</NavLink> link in the sidebar.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ); else return (<div></div>);
    }
}

export default Home;
