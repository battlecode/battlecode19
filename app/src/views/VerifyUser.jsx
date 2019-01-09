import React, { Component } from 'react';

import Api from '../api';

class VerifyUser extends Component {
  state = {
    message: '',
    success: false,
  }

  componentDidMount() {
    Api.verifyAccount('', this.callback);
  }

  callback = (data, success) => {
    if (success) {
      this.setState({ success, message: 'Your email is now verified' });
    } else {
      this.setState({ message: data.status });
    }
  }

  render() {
    const { message, success } = this.state;
    return (
      <div className="content">
        {message}
      </div>
    );
  }
}


export default VerifyUser;
