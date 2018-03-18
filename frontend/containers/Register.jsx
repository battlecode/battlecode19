import React from 'react'
import RegisterForm from '../components/RegisterForm'
import { connect } from 'react-redux'
import { register } from  '../actions/auth'
import { authErrors } from '../reducers/index.js'

const Register = (props) => {
  return (
    <div>
      <RegisterForm {...props}/>
      <a href="/login">Login</a>
    </div>
  )
}

function mapStateToProps(state) {
  return {
    errors: authErrors(state),
  }
}

function mapDispatchToProps(dispatch) {
  return {
    onSubmit: (email, username, first_name, last_name, date_of_birth, password) => {
      dispatch(register(email, username, first_name, last_name, date_of_birth, password))
    }
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Register);
