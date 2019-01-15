import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { Switch, Route } from 'react-router';

import Home from './views/home';
import NotFound from './views/not_found';
import Docs from './views/docs';
import Scrimmaging from './views/scrimmaging';
import Tournaments from './views/tournaments';
import Updates from './views/updates';
import Search from './views/search';
import Team from './views/team';
import IDE from './views/ide';
import Account from './views/account';
import ReplayViewer from './views/replay';
import LoginRegister from './views/login_register';
import VerifyUser from './views/VerifyUser';
import PasswordForgot from './views/passwordForgot';
import PasswordChange from './views/passwordChange';

import Footer from './footer';
import NavBar from './navbar';
import SideBar from './sidebar';
import Api from './api';

class App extends Component {
  constructor() {
    super();
    this.state = { logged_in: null };
  }

  componentDidMount() {
    Api.loginCheck((logged_in) => {
      this.setState({ logged_in });
    });
  }

  render() {
    if (this.state.logged_in) {
      return (
        <div className="wrapper">
          <SideBar />
          <div className="main-panel">
            <NavBar />
            <Switch>
              <Route exact path={`${process.env.PUBLIC_URL}/`} component={Home} />
              <Route path={`${process.env.PUBLIC_URL}/home`} component={Home} />
              <Route path={`${process.env.PUBLIC_URL}/docs`} component={Docs} />
              <Route path={`${process.env.PUBLIC_URL}/scrimmaging`} component={Scrimmaging} />
              <Route path={`${process.env.PUBLIC_URL}/updates`} component={Updates} />
              <Route path={`${process.env.PUBLIC_URL}/search`} component={Search} />
              <Route path={`${process.env.PUBLIC_URL}/team`} component={Team} />
              <Route path={`${process.env.PUBLIC_URL}/ide`} component={IDE} />
              <Route path={`${process.env.PUBLIC_URL}/account`} component={Account} />
              <Route path={`${process.env.PUBLIC_URL}/tournaments`} component={Tournaments} />
              <Route path={`${process.env.PUBLIC_URL}/replay`} component={ReplayViewer} />
              <Route path="*" component={NotFound} />
            </Switch>
            <Footer />
          </div>
        </div>
      );
    } if (this.state.logged_in === false) {
      return (
        <Switch>
          <Route path={`${process.env.PUBLIC_URL}/password_forgot`} component={PasswordForgot} />
          <Route path={`${process.env.PUBLIC_URL}/password_change`} component={PasswordChange} />
          <Route path={`${process.env.PUBLIC_URL}/`} component={LoginRegister} />
        </Switch>
      );
    }
    return <div />;
  }
}


ReactDOM.render((
  <BrowserRouter>
    <App />
  </BrowserRouter>
), document.getElementById('root'));
