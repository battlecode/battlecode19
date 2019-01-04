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
            window.init_right_menu();
        }.bind(this));
    }

    render() {
        return (
            <div className="sidebar" data-color="orange">
                <div className="sidebar-wrapper">
                    <div className="logo">
                        <a href="#" className="simple-text">CRUSADE</a>
                    </div>
                    <ul className="nav">
                        <NLink to={`${process.env.PUBLIC_URL}/home`}><i className="pe-7s-home" />Home</NLink>
                        <NLink to={`${process.env.PUBLIC_URL}/docs`}><i className="pe-7s-note2" />Docs</NLink>
                        <NLink to={`${process.env.PUBLIC_URL}/updates`}><i className="pe-7s-bell" />Updates</NLink>
                        <NLink to={`${process.env.PUBLIC_URL}/search`}><i className="pe-7s-search" />Search</NLink>
                        
                        <br />
                        
                        <NLink to={`${process.env.PUBLIC_URL}/team`}><i className="pe-7s-users" />Team</NLink>
                        { this.state.on_team && <NLink to={`${process.env.PUBLIC_URL}/ide`}><i className="pe-7s-pen" />IDE</NLink> }
                        { this.state.on_team && <NLink to={`${process.env.PUBLIC_URL}/scrimmaging`}><i className="pe-7s-joy" />Scrimmaging</NLink> }
                    </ul>
                </div>
            </div>
        );
    }
}

export default SideBar;
