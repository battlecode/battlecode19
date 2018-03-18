import React from 'react';
import ReactDOM from 'react-dom'

import createHistory from 'history/createBrowserHistory'
import configureStore from './store'

import { Provider, connect } from 'react-redux'
import { ConnectedRouter } from 'react-router-redux'
import { Route, Switch } from 'react-router'
import AppContainer from './containers/AppContainer';
import PrivateRoute from './containers/PrivateRoute';
import Login from './containers/Login';
import Logout from './containers/Logout';
import Register from './containers/Register';

const history = createHistory()
const store = configureStore(history)

import {serverMessage} from './reducers'

class App extends React.Component {
  render() {
    return (
      <div>
        <AppContainer />
      </div>
    )
  }
}

ReactDOM.render((
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <div className="container">
        <div className="row">
          <div className="col-sm-12">
            <Switch>
              <Route exact path="/login" component={Login} />
              <Route exact path="/register" component={Register} />
              <PrivateRoute path="/" component={App}/>
            </Switch>
          </div>
        </div>
      </div>
    </ConnectedRouter>
  </Provider>
), document.getElementById('app'));
