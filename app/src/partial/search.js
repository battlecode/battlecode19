import React, { Component } from 'react';
import Api from '../api';

class UserList extends Component {
	render() {
		if (this.props.users.length > 0) return (
		  <div className="card">
		    <div className="header">
		    	<h4 className="title">Users</h4>
		    </div>
		    <div className="content table-responsive table-full-width">
		    	<table className="table table-hover table-striped">
		          <thead>
		          	<tr>
		          		<th>User</th>
		              	<th>Team</th>
		              	<th>Bio</th>
		          	</tr>
		          </thead>
		        	<tbody>
			        	{ this.props.users.map(user => <tr key={ user.id }>
	                    <td>{ user.username }</td>
	                    <td>{ user.team }</td>
	                    <td>{ user.bio }</td>
	              </tr> )}
		        	</tbody>
		      	</table>
		    </div>
			</div>
		);
		else return (<div></div>);
	}
}

class TeamList extends Component {
	render() {
		if (this.props.teams.length > 0) return (
		  <div className="card">
		    <div className="header">
		    	<h4 className="title">Teams</h4>
		    </div>
		    <div className="content table-responsive table-full-width">
		    	<table className="table table-hover table-striped">
		          <thead>
		          	<tr>
		          		<th>Team</th>
		              <th>Users</th>
		              <th>Bio</th>
		          	</tr>
		          </thead>
		        	<tbody>
			        	{ this.props.teams.map(team => <tr key={ team.id }>
	                    <td>{ team.name }</td>
	                    <td>{ team.users.join(", ") }</td>
	                    <td>{ team.bio }</td>
	              </tr> )}
		        	</tbody>
		      	</table>
		    </div>
			</div>
		);
		else return (<div></div>);
	}
}


class Search extends Component {
	constructor() {
		super();
		this.state = {users:[], teams:[]};

		this.handleChange = this.handleChange.bind(this);
		this.search = this.search.bind(this);
		
	}

	handleChange(e) {
		this.setState({ input: e.target.value });
	} 

	search() {
		Api.search(this.state.input, function(users, teams) {
			this.setState({
				teams: teams,
				users: users
			});
		}.bind(this));
	}

	render() {
	    return (
	      	<div className="content">
	        	<div className="content">
			        <div className="container-fluid">
			          	<div className="row">
			          		<div className="col-md-12">
			          			<div className="card">
			          			<div className="content">
			          			    <div className="input-group">
     									<input type="text" className="form-control" onChange={this.handleChange} placeholder="Search for..." />
      									<span className="input-group-btn">
        									<button className="btn btn-default" onClick={this.search} type="button">Go!</button>
      									</span>
   									</div>
    							</div>
			          			</div>
			          		</div>
				            <div className="col-md-12">
				            	<UserList users={this.state.users} />
				            </div>
				            <div className="col-md-12">
				              <TeamList teams={this.state.teams} />
				            </div>

			          	</div>
			        </div>
			    </div>
	     	</div>
	    );
  	}
}

export default Search;