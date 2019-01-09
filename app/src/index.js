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
              <Route exact path="/" component={Home} />
              <Route path="/home" component={Home} />
              <Route path="/docs" component={Docs} />
              <Route path="/scrimmaging" component={Scrimmaging} />
              <Route path="/updates" component={Updates} />
              <Route path="/search" component={Search} />
              <Route path="/team" component={Team} />
              <Route path="/ide" component={IDE} />
              <Route path="/account" component={Account} />
              <Route path="/tournaments" component={Tournaments} />
              <Route path="/replay" component={ReplayViewer} />
              <Route path="*" component={NotFound} />
            </Switch>
            <Footer />
          </div>
        </div>
      );
    } if (this.state.logged_in === false) {
      return (
        <Switch>
          <Route path="/password/forgot" component={PasswordForgot} />
          <Route path="/password/change" component={PasswordChange} />
          <Route path="/" component={LoginRegister} />
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
