import React from 'react'
import { Redirect } from 'react-router'
import TextInput from './TextInput'

export default class RegisterForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      submitted: false,
      email: '',
      first_name: '',
      last_name: '',
      date_of_birth: '',
      password: ''
    }
    this.handleInputChange = this.handleInputChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  handleInputChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    this.setState({ [name]: value });
  }

  onSubmit(event) {
    event.preventDefault();
    this.props.onSubmit(
      this.state.email,
      this.state.username,
      this.state.first_name,
      this.state.last_name,
      this.state.date_of_birth,
      this.state.password
    )
  }

  render() {
    const errors = this.props.errors || {}

    return (
      <form onSubmit={this.onSubmit}>
        <h1>Register</h1>
        {errors.non_field_errors ? errors.non_field_errors.map(error => (<span>{error}</span>)) : ""}
        <TextInput name="email" label="Email"
                   error={errors.email}
                   onChange={this.handleInputChange} />
        <TextInput name="username" label="Username"
                   error={errors.username}
                   onChange={this.handleInputChange} />
        <TextInput name="first_name" label="First Name"
                   error={errors.first_name}
                   onChange={this.handleInputChange} />
        <TextInput name="last_name" label="Last Name"
                   error={errors.last_name}
                   onChange={this.handleInputChange} />
        <TextInput name="date_of_birth" label="Date of Birth (YYYY-MM-DD)"
                   error={errors.date_of_birth}
                   onChange={this.handleInputChange} />
        <TextInput name="password" label="Password"
                   error={errors.password} type="password"
                   onChange={this.handleInputChange} />
        <button type="submit" color="primary" size="lg">Register</button>
      </form>
    )
  }
}
