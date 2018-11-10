import React, { Component } from 'react';
import Api from '../api';

import TeamList from '../components/teamList';

class ScrimmageRequestor extends Component {

    state = {
        autocompleteOptions: [],
        teams: null,
        teamLimit: 0,
        teamPage: 1,
        input: "",
    };

    handleInput = (e) => {
        const { state } = this;

        const newInput = e.target.value;

        this.setState({
            input: newInput,
            autocompleteOptions: [],
        });
        if (newInput) {
            Api.searchTeam(newInput, 1, this.onAutocompleteReturn)
        };
    }

    onAutocompleteReturn = ({query, teams}) => {
        const { state } = this;

        if (query === state.input) {
            this.setState({autocompleteOptions: teams});
        }
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

        const hasAutocompleteOptions = !!state.autocompleteOptions.length;

        const dataOptions = hasAutocompleteOptions && (
            <datalist id="team-options">
            {state.autocompleteOptions.map(option => {
                    return <option value={option.name}/>
                })
            }
            </datalist>
        )

        return (
            <div>
                <div className="col-md-12">
                    <div className="card">
                        <div className="content">
                            <form className="input-group" onSubmit = {this.onSearch} >
                                <input 
                                    type="text" 
                                    list = {hasAutocompleteOptions && "team-options"}
                                    id="team-search" 
                                    className="form-control" 
                                    onChange={ this.handleInput } 
                                    placeholder="Search for a Team to Scrimmage..." 
                                />
                                {dataOptions}
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