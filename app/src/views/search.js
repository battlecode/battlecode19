import React, { Component } from 'react';
import Api from '../api';

import TeamList from '../components/teamList';
import UserList from '../components/userList';


class Search extends Component {
    state = {
      users: null,
      userLimit: 0,
      userPage: 1,
      teams: null,
      teamLimit: 0,
      teamPage: 1,
      input: '',
    };

    componentDidMount() {
      const { input } = this.state;
      Api.search(input, this.onDataLoad);
    }

    handleChange = (e) => {
      const { input } = this.state;
      this.setState({ input: e.target.value });
    }

    onDataLoad = (data) => {
      this.setState(data);
    }

    getTeamPage = (page) => {
      const { state } = this;
      if (page !== state.teamPage && page >= 0 && page <= state.teamLimit) {
        Api.searchTeam(state.input, page, this.onDataLoad);
      }
    }

    getUserPage = (page) => {
      const { state } = this;
      if (page !== state.userPage && page >= 0 && page <= state.userLimit) {
        Api.searchUser(state.input, page, this.onDataLoad);
      }
    }

    search = (e) => {
      const { input } = this.state;
      e.preventDefault();
      Api.search(input, this.onDataLoad);
    }

    render() {
      const { state } = this;
      return (
        <div className="content">
          <div className="container-fluid row">
            <div className="col-md-12">
              <div className="card">
                <div className="content">
                  <form className="input-group" onSubmit={this.search}>
                    <input type="text" className="form-control" onChange={this.handleChange} placeholder="Search for..." />
                    <span className="input-group-btn">
                      <button className="btn btn-default" type="submit" value="Submit">Go!</button>
                    </span>
                  </form>
                </div>
              </div>
            </div>
            <div className="col-md-12">
              <UserList
                users={state.users}
                page={state.userPage}
                pageLimit={state.userLimit}
                onPageClick={this.getUserPage}
              />
            </div>
            <div className="col-md-12">
              <TeamList
                teams={state.teams}
                page={state.teamPage}
                pageLimit={state.teamLimit}
                onPageClick={this.getTeamPage}
              />
            </div>
          </div>
        </div>
      );
    }
}

export default Search;
