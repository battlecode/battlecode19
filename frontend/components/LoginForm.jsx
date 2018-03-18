import React, {Component} from 'react'
import { Button, Jumbotron, Form } from 'reactstrap';
import TextInput from './TextInput'

export default class LoginForm extends Component {
  constructor(props) {
    super(props);

    this.state = {
      email: '',
      password: '' 
    };

    this.handleInputChange = this.handleInputChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  handleInputChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });
  }

  onSubmit(event) {
    event.preventDefault();
    this.props.onSubmit(this.state.email, this.state.password);
  }

  render() {
    const errors = this.props.errors || {}

    return (
      <Jumbotron className="container">
        <Form onSubmit={this.onSubmit}>
          <h1>Authentication</h1>
          {errors.non_field_errors ? errors.non_field_errors.map(error => (<span>{error}</span>)) : ""}
          <TextInput name="email" label="Email" 
                     error={errors.email}
                     onChange={this.handleInputChange} />
          <TextInput name="password" label="Password" 
                     error={errors.password} type="password"  
                     onChange={this.handleInputChange} />
          <Button type="submit" color="primary" size="lg">Log In</Button>
        </Form>
      </Jumbotron>
    )
  }
}
