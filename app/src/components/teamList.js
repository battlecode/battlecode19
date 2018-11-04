import React, { Component } from 'react';

import PaginationControl from './paginationControl';

const SUCCESS_TIMEOUT = 2000

class TeamList extends Component {

    state = {
        pendingRequests: {},
        successfulRequests: {},
    }

    onTeamRequest = (team) => {
        this.setState(prevState => {
            return {
                pendingRequests: {
                    ...prevState.pendingRequests,
                    [team] : true,
                }
            }
        });
    }

    onRequestSuccess = (team) => {
        this.setState(prevState => {
            return {
                pendingRequests: {
                    ...prevState.pendingRequests,
                    [team]: false,
                },
                successfulRequests: {
                    ...prevState.successfulRequests,
                    [team]: true,
                }
            }
        });

        setTimeout(() => this.successTimeoutRevert(team), SUCCESS_TIMEOUT);
    }

    successTimeoutRevert = (team) => {
        this.setState(prevState => {
            return {
                successfulRequests: {
                    ...prevState.successfulRequests,
                    [team]: false,
                }
            }
        });
    }

    render() {
        const { props }  = this;

        if (!props.teams) {
            return null;
        } else if (props.teams.length === 0) { 
            return (
                <div className="card">
                    <div className="header">
                        <h4 className="title">No Teams Found!</h4>
                    </div> 
                </div>
            )
        }
        else {
            const teamRows = props.teams.map(team => {
                return (
                    <tr key={ team.id }>
                        <td>{ team.name }</td>
                        <td>{ team.users.join(", ") }</td>
                        <td>{ team.bio }</td>
                        {props.canRequest && (
                            <td><button className="btn btn-xs">Request</button></td>
                        )}
                    </tr>
                )
            })

            return (
                <div>
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
                                    {teamRows}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <PaginationControl 
                        page={props.page} 
                        pageLimit={props.pageLimit} 
                        onPageClick={props.onPageClick}
                    />            
                </div>
            );
        }
    }
}

export default TeamList;