import React, { Component } from 'react';
import { NavLink } from 'react-router-dom';

class NLink extends Component {
	render() {
		return (
			<NavLink {...this.props} activeStyle={{ opacity:1, fontWeight:800 }} />
			);
	}
}

class SideBar extends Component {
    render() {
        return (
            <div className="sidebar" data-color="orange">
	    		<div className="sidebar-wrapper">
		            <div className="logo">
		            	<a href="/" className="simple-text">
		                	PRO
		            	</a>
		            </div>
		            <ul className="nav">
		            <li>
		              <NLink to="/home"><i className="pe-7s-home" />Home</NLink>
		            </li>
		            <li>
		            	<NLink to="/docs"><i className="pe-7s-note2" />Docs</NLink>
		            </li>
		              <li>
		              	<NLink to="/updates"><i className="pe-7s-bell" />Updates</NLink>
		              </li>
		              <li>
		              	<NLink to="/search"><i className="pe-7s-search" />Search</NLink>
		              </li>
		              <br />
		              <li>
		              	<NLink to="/team"><i className="pe-7s-users" />Team</NLink>
		              </li>
		              <li>
		              	<NLink to="/ide"><i className="pe-7s-pen" />IDE</NLink>
		              </li>
		              <li>
		              	<NLink to="/scrimmaging"><i className="pe-7s-joy" />Scrimmaging</NLink>
		              </li>
		              <li>
		              <NLink to="/tournaments"><i className="pe-7s-cup" />Tournaments</NLink>
		              </li>
		            </ul>
	        	</div>
        	</div>
        );
    }
}

export default SideBar;
