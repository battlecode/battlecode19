import React from 'react'
import { connect } from 'react-redux'

import {fetchUsers} from '../actions/users'
import {serverMessage} from '../reducers/users'
import Logout from './Logout'

class AppContainer extends React.Component {
  componentDidMount() {
    this.props.fetchUsers()
  }

  render() {
    const userList = (
      <ul>
        {this.props.users.map(user => (
          <li>Contact {user.first_name} {user.last_name} at {user.email}.</li>
        ))}
      </ul>
    )

    return (
      <div>
        <h1>Sample App!</h1>
        <p>{this.props.placeholder}</p>
        {userList}
        <Logout />
      </div>
    )
  }
}

export default connect(
  state => serverMessage(state),
  { fetchUsers: fetchUsers }
)(AppContainer);
