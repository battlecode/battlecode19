import React, { Component } from 'react';
import Api from '../api';

class PasswordChange extends Component {
    state = {
        password: '',
        passwordVerify: '',
        success: false,
        error: '',
    }

    changePassword = (e) => {
        const { state, props } = this;
        e.preventDefault();

        if (!state.password) {
            this.setState({ error: "Please enter a password"});
        }

        if (state.password != state.passwordVerify) {
            this.setState({ error: "Passwords do not match. "});
            return;
        }

        let token = this.props.location.search && this.props.location.search.split("=");
        token = token.length > 1 && token[1];

        console.log(token);

        Api.doResetPassword(state.password, token, this.onApiReturn);
    }

    changeHandler = (e) => {
        const { id } = e.target;
        const val = e.target.value;
        this.setState({[id]: val});
    }

    onApiReturn = (data, success) => {
        if (success) {
            this.setState({success: true});
            const redirect = () => {
                this.props.router.push('/dash/')
            }
            setTimeout(redirect.bind(this), 3000);
        } else {
            this.setState({error: 'Password Reset Failed. Try Again Later'});
        }
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
                  <b>Error: </b>
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
                  <form onSubmit={this.changePassword}>
                    <div className="form-group">
                      <label>New Password</label>
                      <input
                        type="password"
                        id="password"
                        className="form-control"
                        onChange={this.changeHandler}
                      />
                    <label>Confirm Password</label>
                      <input
                        type="password"
                        id="passwordVerify"
                        className="form-control"
                        onChange={this.changeHandler}
                      />
                    </div>
                    <button
                      type="submit"
                      value="Submit"
                      className="btn btn-secondary btn-block btn-fill"
                    >
                      Reset Your Password
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