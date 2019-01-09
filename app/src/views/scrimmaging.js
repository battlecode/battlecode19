import React, { Component } from 'react';
import Api from '../api';

import ScrimmageRequestor from '../components/scrimmageRequestor';

class ScrimmageRequest extends Component {

    state = {
        open: true,
    }

    accept = () => {
        Api.acceptScrimmage(this.props.id, function() {
            this.setState({'open':false});
            this.props.refresh();
        }.bind(this));
    }

    reject = () => {
        Api.rejectScrimmage(this.props.id, function() {
            this.setState({'open':false});
            this.props.refresh();
        }.bind(this));
    }

    render() {
        if (this.state.open) return (
            <div className="alert alert-info" style={{ height:"3em" }}>
                <span style={{float:"left"}}>Scrimmage request from { this.props.team }.</span>
                <span style={{float:"right"}} className="pull-right"><button onClick={ this.accept } className="btn btn-success btn-xs">Accept</button> <button onClick={ this.reject } className="btn btn-danger btn-xs">Reject</button></span>
            </div>
        );
        else return (<div></div>);
    }
}

class ScrimmageRequests extends Component {

    state = {
        requests: [],
    };


    refresh = () => {
        Api.getScrimmageRequests(function(r) {
            this.setState({requests:r});
        }.bind(this));
    }

    componentDidMount() {
        this.refresh();
    }

    render() {
        return (
            <div className="col-md-12">
                { this.state.requests.map(r => <ScrimmageRequest refresh={this.props.refresh} key={r.id} id={r.id} team={r.team} />) }
            </div>
        );
    }
}

class ScrimmageHistory extends Component {

    state = {
        scrimmages: [],
    };


    refresh = () => {
        Api.getScrimmageHistory(function(s) {
            this.setState({ scrimmages: s });
        }.bind(this));
    }

    componentDidMount() {
        this.refresh();
    }

    playReplay(e) {
        e.preventDefault();
        var url = e.target.href;
        window.open(url, "replay_window", "scrollbars=no,resizable=no,status=no,location=no,toolbar=no,menubar=no,width=600,height=750");
    }

    render() {
        return (
            <div className="col-md-12">
                <div className="card">
                    <div className="header">
                        <h4 className="title">Scrimmage History <button onClick={this.props.refresh} style={{marginLeft:"10px"}} type="button" className="btn btn-primary btn-sm">Refresh</button></h4>
                    </div>
                    <div className="content table-responsive table-full-width">
                        <table className="table table-hover table-striped">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Time</th>
                                    <th>Status</th>
                                    <th>Team</th>
                                    <th>Color</th>
                                    <th>Replay</th>
                                </tr>
                            </thead>
                            <tbody>
                                { this.state.scrimmages.map(s => (
                                    <tr key={s.id}>
                                        <td>{ s.date }</td>
                                        <td>{ s.time }</td>
                                        <td>{ s.status }</td>
                                        <td>{ s.team }</td>
                                        <td>{ s.color }</td>
                                        { s.replay?<td><a href={`${process.env.PUBLIC_URL}/replay?${s.replay}`} onClick={ this.playReplay }>Watch</a></td>:<td>N/A</td> }
                                    </tr>
                                )) }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )
    }
}

class Scrimmaging extends Component {

    refresh = () => {
        this.requests.refresh();
        this.history.refresh();
    }

    render() {
        return (
            <div className="content">
                <div className="content">
                    <div className="container-fluid">
                        <div className="row">
                            <ScrimmageRequests ref={requests => {this.requests = requests}} refresh={this.refresh} />
                            <ScrimmageRequestor refresh={this.refresh} />
                            <ScrimmageHistory ref={history => {this.history = history}} refresh={this.refresh} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Scrimmaging;