import React, { Component } from 'react';
import Api from '../api';

class Tournament extends Component {
  render() {
    return (
      <div className="accordion" id={ this.props.name }>
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">
              <button className="btn btn-default btn-block collapsed" type="button" data-toggle="collapse" data-target={ '#' + this.props.name + '0'}>
                { this.props.name.charAt(0).toUpperCase() + this.props.name.slice(1) } Tournament
              </button>
            </h5>
          </div>
          <div id={ this.props.name + '0' } className="collapse" data-parent={ '#' + this.props.name } style={{ 'margin-top':'-1em' }}>
            <div className="card-body">
              <iframe title={ this.props.challonge } src={"http://challonge.com/" + this.props.challonge + "/module"} width="100%" height="400px" frameborder="0" scrolling="auto" allowtransparency="true"></iframe>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

class Tournaments extends Component {
  constructor() {
    super();
    this.state = {'tournaments':[]};
  }

  componentDidMount() {
    Api.getTournaments(function(t) {
      this.setState({tournaments:t});
    }.bind(this));
  }

  render() {
    return (
        <div className="content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-12">
              { this.state.tournaments.map(t => 
                <Tournament name={ t.name } challonge={ t.challonge } />
              )}
            </div>
          </div>
        </div>
      </div>

    );
  }
}

export default Tournaments;