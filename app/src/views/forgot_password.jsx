import React, { Component } from 'react';
import Api from '../api';

class ForgotPassword extends Component {
  state = {
    success: false,
    error: '',
    email: '',
  }

  forgotPassword = () => {
    const { email } = this.state;
    Api.forgotPassword(email, this.callback);
  }

  callback = (data, success) => {
    if (success) {
      this.setState({ success: 'Email sent' });
    } else {
      this.setState({ error: 'Email not found' });
    }
  }

  changeHandler = (e) => {
    const { value } = e.target;
    this.setState({ email: value });
  }

  render() {
    const { error, success } = this.state;
    return (
      <div
        className="content orangeBackground"
        style={{
          height: '100vh',
          width: '100vw',
          position: 'absolute',
          top: '0px',
          left: '0px',
        }}
      >
        {error && (
          <div
            className="card"
            style={{
              padding: '20px',
              width: '350px',
              margin: '40px auto',
              marginBottom: '0px',
              fontSize: '1.1em',
            }}
          >
            <b>Error.</b>
            {error}
          </div>
        )}

        {success && (
          <div
            className="card"
            style={{
              padding: '20px',
              width: '350px',
              margin: '40px auto',
              marginBottom: '0px',
              fontSize: '1.1em',
            }}
          >
            <b>Success.</b>
            {' '}
            {success}
          </div>
        )}

        <div
          className="card"
          style={{
            width: '350px',
            margin: error ? '20px auto' : '100px auto',
          }}
        >
          <div className="content">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                id="email"
                className="form-control"
                onChange={this.changeHandler}
              />
            </div>
            <button
              type="button"
              onClick={this.forgotPassword}
              className="btn btn-secondary btn-block btn-fill"
            >
              Forgot Password
            </button>
            <div className="clearfix" />
          </div>
        </div>
      </div>
    );
  }
}

export default ForgotPassword;
