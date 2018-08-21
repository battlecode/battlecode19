import React, { Component } from 'react';
import Api from '../api';


class ScrimmageRequest extends Component {
    constructor() {
        super();
        this.state = {'open':true};
        this.accept = this.accept.bind(this);
        this.reject = this.reject.bind(this);
    }

    accept() {
        Api.acceptScrimmage(this.props.id, function() {
            this.setState({'open':false});
            this.props.refresh();
        }.bind(this));
    }

    reject() {
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
    constructor() {
        super();
        this.state = {'requests':[]};

        this.refresh = this.refresh.bind(this);
    }

    refresh() {
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

class ScrimmageRequestor extends Component {
    constructor() {
        super();

        this.state = {up:"Request", input:""};
        this.changeHandler = this.changeHandler.bind(this);
        this.request = this.request.bind(this);
    }

    request() {
        this.setState({'up':'<i class="fa fa-circle-o-notch fa-spin"></i>'});
        Api.requestScrimmage(this.state.input, function(response) {
            if (response) {
                this.setState({'up':'<i class="fa fa-check"></i>'});
                this.props.refresh();
            }
            else this.setState({'up':'Team not found'});
            setTimeout(function() {
                this.setState({'up':'Request'});
            }.bind(this),2000);
        }.bind(this))
    }

    changeHandler(e) {
        this.setState({input: e.target.value});
    }

    render() {
        return (
            <div className="col-md-12">
                <div className="card">
                    <div className="content">
                        <div className="input-group">
                            <input type="text" className="form-control" onChange={ this.changeHandler } placeholder="Team to request..." />
                            <span className="input-group-btn">
                                <button className="btn btn-default" type="button" onClick={ this.request } dangerouslySetInnerHTML={{__html:this.state.up }}></button>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

class ScrimmageHistory extends Component {
    constructor() {
        super();
        this.state = {'scrimmages':[]};

        this.refresh = this.refresh.bind(this);
    }

    refresh() {
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
                                        { s.replay?<td><a href={ '/replay?' + s.replay } onClick={ this.playReplay }>Watch</a></td>:<td>N/A</td> }
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
    constructor() {
        super();

        this.refresh = this.refresh.bind(this);
    }

    refresh() {
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