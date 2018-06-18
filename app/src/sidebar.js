import React, { Component } from 'react';
import { NavLink } from 'react-router-dom';
import Api from './api';


class NLink extends Component {
    render() {
        return (
            <li><NavLink {...this.props} activeStyle={{ opacity:1, fontWeight:800 }} /></li>
        );
    }
}

class SideBar extends Component {
    constructor() {
        super();
        this.state = {on_team:null};
    }

    componentDidMount() {
        Api.getUserTeam(function(e) {
            this.setState({on_team:(e !== null)});
        }.bind(this));
    }

    render() {
        return (
            <div className="sidebar" data-color="orange">
                <div className="sidebar-wrapper">
                    <div className="logo">
                        <a href="/" className="simple-text">PRO</a>
                    </div>
                    <ul className="nav">
                        <NLink to="/home"><i className="pe-7s-home" />Home</NLink>
                        <NLink to="/docs"><i className="pe-7s-note2" />Docs</NLink>
                        <NLink to="/updates"><i className="pe-7s-bell" />Updates</NLink>
                        <NLink to="/search"><i className="pe-7s-search" />Search</NLink>
                        
                        <br />
                        
                        <NLink to="/team"><i className="pe-7s-users" />Team</NLink>
                        { this.state.on_team && <NLink to="/ide"><i className="pe-7s-pen" />IDE</NLink> }
                        { this.state.on_team && <NLink to="/scrimmaging"><i className="pe-7s-joy" />Scrimmaging</NLink> }
                        { this.state.on_team && <NLink to="/tournaments"><i className="pe-7s-cup" />Tournaments</NLink> }
                    </ul>
                </div>
            </div>
        );
    }
}

export default SideBar;
