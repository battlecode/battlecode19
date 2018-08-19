import React, { Component } from 'react';
import { NavLink } from 'react-router-dom';
import Api from './api';

class NavBar extends Component {
    logout() {
        Api.logout(function(e) {
            window.location.reload();
        });
    }

    toggleNavigation() {
        window.click_toggle();
    }

    render() {
        return (
            <nav className="navbar navbar-default navbar-fixed">
                <div className="container-fluid">
                    <div className="navbar-header">
                        <button type="button" onClick={this.toggleNavigation} className="navbar-toggle" data-toggle="collapse" data-target="#navigation-example-2">
                            <span className="sr-only">Toggle navigation</span>
                            <span className="icon-bar" />
                            <span className="icon-bar" />
                            <span className="icon-bar" />
                        </button>
                        <a className="navbar-brand" href="https://battlecode.org">Battlecode</a>
                    </div>
                    <div className="collapse navbar-collapse">
                        <ul className="nav navbar-nav navbar-right">
                            <li>
                                <NavLink to="/account">Account</NavLink>
                            </li>
                            <li>
                                <a onClick={ this.logout }>Log out</a>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
        );
    }
}

export default NavBar;