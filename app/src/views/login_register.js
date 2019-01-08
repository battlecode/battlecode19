import React, { Component } from 'react';
import Api from '../api';

class LoginRegister extends Component {
  constructor() {
    super();
    this.state = {
      email: '',
      password: '',
      username: '',
      first: '',
      last: '',
      dob: '',
      register: false,
      error: '',
      success: '',
    };

    this.changeHandler = this.changeHandler.bind(this);
  }

  login = () => {
    const { username, password } = this.state;
    Api.login(username, password, this.callback);
  };

  forgotPassword = () => {
    window.location.replace('/forgotPassword');
  }

  callback = (message, success) => {
    if (success) {
      window.location.reload();
    } else {
      this.setState({
        error: message,
      });
    }
  }

  formSubmit = (event) => {
    if (event.key === 'Enter') {
      const { register } = this.state;
      if (register) this.register();
      else this.login();
    }
  }

  register = () => {
    const {
      username,
      register,
      email,
      first,
      last,
      dob,
      password,
    } = this.state;
    if (register) {
      // ensure that all fields are correct
      if (username.length < 4) this.setState({ error: 'Username must be at least 4 characters.' });
      else if (email.length < 4) this.setState({ error: 'Email must be at least 4 characters.' });
      else if (username.indexOf('.') > -1) this.setState({ error: 'Username must not contain dots.' });
      else if (first.length < 1) this.setState({ error: 'Must provide first name.' });
      else if (last.length < 1) this.setState({ error: 'Must provide last name.' });
      else if (dob.split('-').length !== 3 || dob.length !== 10) this.setState({ error: 'Must provide DOB in YYYY-MM-DD form.' });
      else if (password.length < 6) this.setState({ error: 'Password must be at least 6 characters.' });
      else {
        Api.register(email, username, password, first, last, dob, this.callback);
      }
    } else this.setState({ register: true });
  };

  forgot = () => {
    const { email } = this.state;
    Api.forgotPassword(email, (success) => {
      if (success) {
        this.setState({
          success: 'An email has been sent if such a user exists.',
        });
      } else {
        this.setState({
          error: 'Password reset failed, something went wrong.',
        });
      }
    });
  };

  changeHandler(e) {
    const { id } = e.target;
    const val = e.target.value;
    this.setState((prevState) => {
      prevState[id] = val;
      return prevState;
    });
  }

  render() {
    const { error, success, register } = this.state;
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
            <div className="row">
              <div className="col-md-12">
                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    id="username"
                    className="form-control"
                    onChange={this.changeHandler}
                  />
                </div>
              </div>
              <div style={{ display: register ? 'block' : 'none' }}>
                <div className="col-xs-6">
                  <div className="form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      id="first"
                      className="form-control"
                      onChange={this.changeHandler}
                    />
                  </div>
                </div>
                <div className="col-xs-6">
                  <div className="form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      id="last"
                      className="form-control"
                      onChange={this.changeHandler}
                    />
                  </div>
                </div>
                <div className="col-xs-6">
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      id="email"
                      className="form-control"
                      onChange={this.changeHandler}
                    />
                  </div>
                </div>
                <div className="col-xs-6">
                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input
                      type="text"
                      id="dob"
                      placeholder="YYYY-MM-DD"
                      className="form-control"
                      onChange={this.changeHandler}
                    />
                  </div>
                </div>
              </div>
              <div className="col-md-12">
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    id="password"
                    className="form-control"
                    onChange={this.changeHandler}
                    onKeyPress={this.formSubmit}
                  />
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={this.login}
              className="btn btn-success btn-block btn-fill"
            >
              Login
            </button>
            <button
              type="button"
              onClick={this.register}
              className="btn btn-primary btn-block btn-fill"
            >
              Register
            </button>
            <a
              type="button"
              href="/forgotPassword"
              className="btn btn-secondary btn-block btn-fill"
            >
              Forgot Password

            </a>

            <div className="clearfix" />
          </div>
        </div>
      </div>
    );
  }
}

export default LoginRegister;
