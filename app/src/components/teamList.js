import React, { Component } from 'react';

import PaginationControl from './paginationControl';

class TeamList extends Component {

    render() {
        const { props }  = this;


        if (props.teams.length > 0) {
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
                    />            </div>
            );
        } 
        else {
            return (<div></div>)
        };
    }
}

export default TeamList;