import React from 'react'
import { connect } from 'react-redux'
import LogoutButton from '../components/LogoutButton'
import { logout } from  '../actions/auth'
import { authErrors } from '../reducers/index.js'

const Logout = (props) => {
  return <LogoutButton {...props} />
}

function mapStateToProps(state) {
  return {
    errors: authErrors(state),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    onClick: () => {
      dispatch(logout())
    }
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Logout);
