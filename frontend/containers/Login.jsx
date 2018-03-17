import React from 'react'
import { connect } from 'react-redux'
import { Redirect } from 'react-router'
import LoginForm from '../components/LoginForm'
import { login } from  '../actions/auth'
import { authErrors, isAuthenticated } from '../reducers/index.js'

const Login = (props) => {
  if (props.isAuthenticated) {
    return <Redirect to='/' />
  } else {
    return (
      <div className="login-page">
        <LoginForm {...props}/>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    errors: authErrors(state),
    isAuthenticated: isAuthenticated(state)
  }
}

function mapDispatchToProps(dispatch) {
  return {
    onSubmit: (email, password) => {
      dispatch(login(email, password))
    }
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Login);
