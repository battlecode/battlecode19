import React from 'react'
import { Alert, Button } from 'reactstrap';

export default class LogoutButton extends React.Component {
  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }

  onClick(event) {
    event.preventDefault();
    this.props.onClick();
  }

  render() {
    const errors = this.props.errors || {}
    return (
      <div>
        {errors.non_field_errors ? <Alert color="danger">{errors.non_field_errors}</Alert> : ""}
        <Button color="primary" size="lg" onClick={this.onClick}>Log Out</Button>
      </div> 
    )
  }
}
