import React, { Component } from 'react';
import { NavLink } from 'react-router-dom';

class NLink extends Component {
    render() {
        return (
            <li><NavLink {...this.props} activeStyle={{ opacity:1, fontWeight:800 }} /></li>
        );
    }
}

class SideBar extends Component {
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
                        <NLink to="/ide"><i className="pe-7s-pen" />IDE</NLink>
                        <NLink to="/scrimmaging"><i className="pe-7s-joy" />Scrimmaging</NLink>
                        <NLink to="/tournaments"><i className="pe-7s-cup" />Tournaments</NLink>
                    </ul>
                </div>
            </div>
        );
    }
}

export default SideBar;
