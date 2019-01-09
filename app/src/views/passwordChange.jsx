import React, { Component } from 'react';
import Api from '../api';

class PasswordChange extends Component {
    state = {
        password: '',
        passwordVerify: '',
        success: false,
        error: false,
    }

    onSuccess = () => {
        this.setState({success: true});
        const redirect = () => {
            this.props.router.push('/dash/')
        }
        this.setTimeOut(redirect.bind(this), 3000);
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
                  <b>Success. Redirecting to login in a few seconds...</b>
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
                  <form onSubmit={this.forgotPassword}>
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
                      type="submit"
                      value="Submit"
                      className="btn btn-secondary btn-block btn-fill"
                    >
                      Forgot Password
                    </button>
                    <div className="clearfix" />
                  </form>
                </div>
              </div>
            </div>
          );
    }
}

export default PasswordChange