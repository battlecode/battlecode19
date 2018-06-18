import React, { Component } from 'react';
import Api from '../api';

class Updates extends Component {
    constructor() {
        super();
        this.state = {'updates':[]};
    }

    componentDidMount() {
        Api.getUpdates(function(new_state) {
            this.setState({ updates: new_state });
        }.bind(this));
    }

    render() {
        return (
            <div className="content">
                <div className="content">
                    <div className="container-fluid">
                        <div className="row">
                            <div className="col-md-12">
                                <div className="card card-plain">
                                    <div className="content table-responsive table-full-width">
                                        <table className="table table-hover">
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Time</th>
                                                    <th>Message</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                { this.state.updates.map(update => <tr key={ update.id }>
                                                    <td>{ update.date }</td>
                                                    <td>{ update.time }</td>
                                                    <td>{ update.message }</td>
                                                 </tr> )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Updates;
