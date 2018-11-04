import React, { Component } from 'react';
import Api from '../api';

import TeamList from '../components/teamList';

class ScrimmageRequestor extends Component {

    state = {
        teams: null,
        teamLimit: 0,
        teamPage: 1,
        input: "",
    };

    handleInput = (e) => {
        this.setState({input: e.target.value});
    }

    onDataLoad = (data) => {
        this.setState(data);
    }

    onPageClick = (page) => {
        const { state } = this;
        if (page !== state.teamPage && page >= 0 && page <= state.teamLimit) {
            Api.searchTeam(state.input, page, this.onDataLoad);
        }
    }

    onSearch = (e) => {
        const { state } = this;
        e.preventDefault();
        Api.searchTeam(state.input, 1, this.onDataLoad);
    }

    render() {
        const {state, props} = this;

        return (
            <div>
                <div className="col-md-12">
                    <div className="card">
                        <div className="content">
                            <form className="input-group" onSubmit = {this.onSearch} >
                                <input type="text" className="form-control" onChange={ this.handleInput } placeholder="Search for a Team to Scrimmage..." />
                                <span className="input-group-btn">
                                    <button className="btn btn-default" type="submit" value="Submit"> Search </button>
                                </span>
                            </form>
                        </div>
                    </div>
                </div>
                <div className="col-md-12">
                    <TeamList 
                        teams={state.teams}
                        page = {state.teamPage}
                        pageLimit = {state.teamLimit}
                        onPageClick = {this.onPageClick}
                        canRequest = {true}
                        onRequestSuccess = {props.refresh}
                    />
                </div>
            </div>
        );
    }
}

export default ScrimmageRequestor;