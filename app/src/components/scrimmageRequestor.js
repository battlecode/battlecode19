import React, { Component } from 'react';
import Api from '../api';

class ScrimmageRequestor extends Component {

    state = {
        up: "Request", 
        input:"",
    };


    request = () => {
        this.setState({'up':'<i class="fa fa-circle-o-notch fa-spin"></i>'});
        Api.requestScrimmage(this.state.input, function(response) {
            if (response) {
                this.setState({'up':'<i class="fa fa-check"></i>'});
                this.props.refresh();
            }
            else this.setState({'up':'Team not found'});
            setTimeout(function() {
                this.setState({'up':'Request'});
            }.bind(this),2000);
        }.bind(this))
    }

    handleInput = (e) => {
        this.setState({input: e.target.value});
    }

    render() {
        return (
            <div className="col-md-12">
                <div className="card">
                    <div className="content">
                        <div className="input-group">
                            <input type="text" className="form-control" onChange={ this.handleInput } placeholder="Search for Teams..." />
                            <span className="input-group-btn">
                                <button className="btn btn-default" type="button" onClick={ this.request } dangerouslySetInnerHTML={{__html: this.state.up}}/>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default ScrimmageRequestor;