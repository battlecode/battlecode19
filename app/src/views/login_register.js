import React, { Component } from 'react';
import Api from '../api';

class LoginRegister extends Component {

  state = {
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

  formSubmit = (e) => {
    console.log("HI!");
    e.preventDefault();
    const { register } = this.state;
    if (register) {
      this.submitRegister();
    }
    else {
      this.submitLogin();
    } 
  }

  startRegister = () => {
    console.log("HIIII")
    this.setState({ register: true, error: "" });
  }

  submitLogin = () => {
    const { username, password } = this.state;
    Api.login(username, password, this.callback);
  };

  submitRegister = () => {
    const {
      username,
      register,
      email,
      first,
      last,
      dob,
      password,
    } = this.state;
      // ensure that all fields are correct
      if (username.length < 4) this.setState({ error: 'Username must be at least 4 characters.' });
      else if (email.length < 4) this.setState({ error: 'Email must be at least 4 characters.' });
      else if (username.indexOf('.') > -1) this.setState({ error: 'Username must not contain dots.' });
      else if (!first) this.setState({ error: 'Must provide first name.' });
      else if (!last) this.setState({ error: 'Must provide last name.' });
      else if (dob.match(/^\d{4}-\d{2}-\d{2}$/g)) this.setState({ error: 'Must provide DOB in YYYY-MM-DD form.' });
      else if (password.length < 6) this.setState({ error: 'Password must be at least 6 characters.' });
      else {
        Api.register(email, username, password, first, last, dob, this.callback);
      }
  };

  changeHandler = (e) => {
    const { id } = e.target;
    const val = e.target.value;
    this.setState({[id]: val});
  }

  render() {
    const { error, success, register } = this.state;

    const errorDiv = error && (
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
        <b>Error. </b>
        {error}
      </div>
    );

    const successDiv = success && (
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
    );

    let buttons = null;
    if (register) {
      buttons = (
        <button
          type="submit"
          value= "submit"
          className="btn btn-primary btn-block btn-fill"
        >
          Register
        </button>
      );
    } else {
      buttons = (
        <div>
          <button
            type="submit"
            value="submit"
            className="btn btn-success btn-block btn-fill"
          >
            Login
          </button>
          <button
            onClick={this.startRegister}
            className="btn btn-primary btn-block btn-fill"
          >
            Register
          </button>
        </div>
      );
    }

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
        {errorDiv}
        {successDiv}
        <form onSubmit={this.formSubmit}>
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
                    />
                  </div>
                </div>
              </div>
              {buttons}
              <br/>
              <a
                href="/password/forgot"
                className="btn btn-secondary btn-block btn-fill"
              >
                Forgot Password
              </a>

              <div className="clearfix" />
            </div>
          </div>
        </form> 
      </div>
    );
  }
}

export default LoginRegister;
