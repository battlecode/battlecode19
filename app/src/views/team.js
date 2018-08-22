import React, { Component } from 'react';
import Api from '../api';

class YesTeam extends Component {

    constructor(props) {
        super();

        this.state = {
            team: {
                name:'',
                id:0,
                team_key:'',
                auto_accept_ranked:true,
                auto_accept_unranked:true,
                bio:'',
                avatar:'',
                users:[]
            },
            'up':'Update Info'
        };

        this.changeHandler = this.changeHandler.bind(this);
        this.checkHandler = this.checkHandler.bind(this);
        this.updateTeam = this.updateTeam.bind(this);
        this.uploadProfile = this.uploadProfile.bind(this);
    }

    leaveTeam() {
        Api.leaveTeam(function(success) {
            if (success) window.location.reload();
        });
    }

    changeHandler(e) {
        var id = e.target.id;
        var val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;

        if (!id) id = e.target.parentElement.id;

        this.setState(function(prevState, props) {
            prevState.team[id] = val;
            return prevState;
        });
    }

    checkHandler(e) {
        var correct = e.target.id;
        if (correct === "") correct = e.target.parentElement.parentElement.id;

        this.setState(function(prevState, props) {
            prevState.team[correct] = !prevState.team[correct];
            return prevState;
        });
    }

    updateTeam() {
        this.setState({'up':'<i class="fa fa-circle-o-notch fa-spin"></i>'});
        Api.updateTeam(this.state.team, function(response) {
            if (response) this.setState({'up':'<i class="fa fa-check"></i>'});
            else this.setState({'up':'<i class="fa fa-times"></i>'});
            setTimeout(function() {
                this.setState({'up':'Update Info'});
            }.bind(this),2000);
        }.bind(this));
    }

    uploadProfile(e) {
        var reader = new FileReader();
        reader.onloadend = () => this.setState(function(prevState, props) {
            prevState.team.bio = reader.result;
            return prevState;
        });
        reader.readAsDataURL(e.target.files[0]);
    }

    componentDidMount() {
        Api.getUserTeam(function(new_state) {
            this.setState({ team:new_state });
        }.bind(this));
    }

    render() {
        return (
            <div>
                <div className="col-md-8">
                    <div className="card">
                        <div className="header">
                            <h4 className="title">Edit Team</h4>
                        </div>
                        <div className="content">
                            <div className="row">
                                <div className="col-md-7">
                                    <div className="form-group">
                                        <label>Team Name (static)</label>
                                        <input type="text" className="form-control" readOnly value={ this.state.team.name } />
                                    </div>
                                </div>
                                <div className="col-md-5">
                                    <div className="form-group">
                                        <label>Secret Key (static)</label>
                                        <input type="text" className="form-control" readOnly value={ this.state.team.team_key } />
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-md-6">
                                    <label id="auto_accept_unranked"><input type="checkbox" checked={ this.state.team.auto_accept_unranked } onChange={this.changeHandler} className="form-control" /> Auto-accept scrimmages.</label>
                                </div>
                                <div className="col-md-6">
                                    <label id="auto_accept_ranked"><input type="checkbox" checked={ this.state.team.auto_accept_ranked } onChange={this.changeHandler} className="form-control" /> Auto-run ranking scrimmages.</label>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-md-12">
                                    <div className="form-group">
                                        <label>Team Avatar URL</label>
                                        <input type="text" id="avatar" className="form-control" onChange={this.changeHandler} value={ this.state.team.avatar } />
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-md-12">
                                    <div className="form-group">
                                        <label>Team Bio</label>
                                        <textarea rows={5} className="form-control" placeholder="Put your team bio here." onChange={this.changeHandler} id="bio" value={ this.state.team.bio } />
                                    </div>
                                </div>
                            </div>
                            
                            <button type="button" onClick={ this.updateTeam } className="btn btn-info btn-fill pull-right" dangerouslySetInnerHTML={{__html:this.state.up }}></button>
                            <button type="button" onClick={ this.leaveTeam } style={{marginRight:'10px'}} className="btn btn-danger btn-fill pull-right">Leave Team</button>
                            <div className="clearfix" />
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card card-user">
                        <div className="image">
                        </div>
                        <div className="content">
                            <div className="author">
                                <img className="avatar border-gray" src={ this.state.team.avatar===''?'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==':this.state.team.avatar } alt="Team Avatar" />
                                <h4 className="title">{ this.state.team.name }<br />
                                    <small>{ this.state.team.users.join(", ") }</small>
                                </h4>
                            </div>
                            <p className="description text-center">{ this.state.team.bio }</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

class NoTeam extends Component {
    constructor() {
        super();
        this.state = {team_name:"", secret_key:"", team_join_name:""};

        this.joinTeam = this.joinTeam.bind(this);
        this.createTeam = this.createTeam.bind(this);
        this.changeHandler = this.changeHandler.bind(this);
    }

    changeHandler(e) {
        var id = e.target.id;
        var val = e.target.value;
        this.setState(function(prevState, props) {
            prevState[id] = val;
            return prevState;
        });
    }

    joinTeam() {
        Api.joinTeam(this.state.secret_key, this.state.team_join_name, function(success) {
            if (success) window.location.reload();
        });
    }

    createTeam() {
        Api.createTeam(this.state.team_name, function(success) {
            window.location.reload();
        });
    }

    render() {
        return (
            <div className="col-md-12">
                    <div className="card">
                        <div className="header">
                            <h4 className="title">Create a Team</h4>
                        </div>
                        <div className="content">
                            <div className="row">
                                <div className="col-md-12">
                                    <div className="form-group">
                                        <label>Team Name</label>
                                        <input type="text" className="form-control" id="team_name" onChange={this.changeHandler} />
                                    </div>
                                </div>
                            </div>
                            <button type="button" className="btn btn-info btn-fill pull-right" onClick={ this.createTeam }>Create</button>
                            <div className="clearfix" />
                        </div>
                    </div>

                    <div className="card">
                        <div className="header">
                            <h4 className="title">Join a Team</h4>
                        </div>
                        <div className="content">
                            <div className="row">
                                <div className="col-md-8">
                                    <div className="form-group">
                                        <label>Team Secret Key</label>
                                        <input type="text" className="form-control" id="secret_key" onChange={this.changeHandler} />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="form-group">
                                        <label>Team Name</label>
                                        <input type="text" className="form-control" id="team_join_name" onChange={this.changeHandler} />
                                    </div>
                                </div>
                            </div>
                            <button type="button" className="btn btn-info btn-fill pull-right" onClick={ this.joinTeam }>Join</button>
                            <div className="clearfix" />
                        </div>
                    </div>

                </div>
        );
    }
}

class Team extends Component {
    constructor() {
        super();
        this.state = { 'team': false }
    }

    componentDidMount() {
        Api.getUserTeam(function(new_state) {
            this.setState({ team:new_state });
        }.bind(this));
    }

    render() {
        return (
            <div className="content">
                <div className="content">
                    <div className="container-fluid">
                        <div className="row">
                            { this.state.team === null && <NoTeam /> }
                            { this.state.team && <YesTeam team={ this.state.team }/> }
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
export default Team;