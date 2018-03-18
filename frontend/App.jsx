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
      <Switch>
        <Route exact path="/login" component={Login} />
        <PrivateRoute path="/" component={App}/>
      </Switch>
    </ConnectedRouter>
  </Provider>
), document.getElementById('app'));
