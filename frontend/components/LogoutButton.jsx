import React from 'react'

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
        {errors.non_field_errors ? <span color="danger">{errors.non_field_errors}</span> : ""}
        <button color="primary" size="lg" onClick={this.onClick}>Log Out</button>
      </div> 
    )
  }
}
