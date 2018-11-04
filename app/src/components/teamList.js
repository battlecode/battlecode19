import React, { Component } from 'react';
import Api from '../api';

import PaginationControl from './paginationControl';

const SUCCESS_TIMEOUT = 2000

class TeamList extends Component {

    state = {
        pendingRequests: {},
        successfulRequests: {},
    }

    onTeamRequest = (teamId) => {
        const { state } = this;
        if (state.pendingRequests[teamId]) {
            return;
        }

        this.setState(prevState => {
            return {
                pendingRequests: {
                    ...prevState.pendingRequests,
                    [teamId] : true,
                }
            }
        });
        Api.requestScrimmage(teamId, this.onRequestFinish);
    }

    onRequestFinish = (teamId, success) => {
        this.setState(prevState => {
            return {
                pendingRequests: {
                    ...prevState.pendingRequests,
                    [teamId]: false,
                },
                successfulRequests: success && {
                    ...prevState.successfulRequests,
                    [teamId]: true,
                }
            }
        });
        if (success) {
            this.props.onRequestSuccess();
            setTimeout(() => this.successTimeoutRevert(teamId), SUCCESS_TIMEOUT);
        }
    }

    successTimeoutRevert = (teamId) => {
        this.setState(prevState => {
            return {
                successfulRequests: {
                    ...prevState.successfulRequests,
                    [teamId]: false,
                }
            }
        });
    }

    render() {
        const { props, state }  = this;

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
                let buttonContent = "Request";
                if (state.pendingRequests[team.id]) {
                    buttonContent = <i className="fa fa-circle-o-notch fa-spin"></i>;
                } else if (state.successfulRequests[team.id]) {
                    buttonContent = <i className="fa fa-check"></i>;
                }
                return (
                    <tr key={ team.id }>
                        <td>{ team.name }</td>
                        <td>{ team.users.join(", ") }</td>
                        <td>{ team.bio }</td>
                        {props.canRequest && (
                            <td><button className="btn btn-xs" onClick={() => this.onTeamRequest(team.id)}>{buttonContent}</button>  </td>
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