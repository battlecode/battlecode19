import React, { Component } from 'react';

import PaginationControl from './paginationControl';

class UserList extends Component {

    render() {
        const { props } = this;

        if (!props.users) {
            return null;
        } else if (props.users.length === 0) { 
            return (
                <div className="card">
                    <div className="header">
                        <h4 className="title">No Users Found!</h4>
                    </div> 
                </div>
            )
        }
        
        return (
            <div>
                <div className="card">
                    <div className="header">
                        <h4 className="title">Users</h4>
                    </div>
                    <div className="content table-responsive table-full-width">
                        <table className="table table-hover table-striped">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Country</th>
                                <th>Bio</th>
                            </tr>
                        </thead>
                            <tbody>
                                { props.users.map(user => 
                                        <tr key={ user.username }>
                                        <td>{ user.username }</td>
                                        <td>{ user.country }</td>
                                        <td>{ user.bio }</td>
                                        </tr> 
                                    )
                                }
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

export default UserList;