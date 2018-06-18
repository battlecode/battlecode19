import React, { Component } from 'react';
import Api from '../api';

class LoginRegister extends Component {
    constructor() {
        super();
        this.state = {
            email:"", 
            password:"", 
            username:"", 
            first:"",
            last:"",
            dob:"",
            register:false, error:"", success:""};

        this.changeHandler = this.changeHandler.bind(this);
        this.login = this.login.bind(this);
        this.register = this.register.bind(this);
        this.forgot = this.forgot.bind(this);
    }

    login() {
        Api.login(this.state.email, this.state.password, function(success) {
            if (success) window.location.reload();
            else this.setState({error:"Incorrect email/password."});
        }.bind(this));
    }

    register() {
        if (this.state.register) {
            // ensure that all fields are correct
            if (this.state.username.length < 4) this.setState({error:"Username must be at least 4 characters."});
            else if (this.state.email.length < 4) this.setState({error:"Email must be at least 4 characters."});
            else if (this.state.first.length < 1) this.setState({error:"Must provide first name."});
            else if (this.state.last.length < 1) this.setState({error:"Must provide last name."});
            else if (this.state.dob.split("/").length !== 3 || this.state.dob.length !== 10) this.setState({error:"Must provide DOB in MM/DD/YYYY form."})
            else if (this.state.password.length < 6) this.setState({error:"Password must be at least 6 characters."})

            else Api.register(this.state.email, this.state.username, this.state.password, function(success) {
                if (success) window.location.reload();
                else this.setState({error:"Registration failed.  Maybe account exists?"});
            }.bind(this));
        } else this.setState({register:true});
    }

    forgot() {
        Api.forgotPassword(this.state.email, function(success) {
            if (success) this.setState({success:"An email has been sent if such a user exists."});
            else this.setState({error:"Password reset failed, something went wrong."});
        }.bind(this));
    }

    changeHandler(e) {
        var id = e.target.id;
        var val = e.target.value;
        this.setState(function(prevState, props) {
            prevState[id] = val;
            return prevState;
        });
    }

    render() {
        return (
            <div className="content orangeBackground" style={{
                height:"100vh", width:"100vw",
                position:"absolute", top:"0px", left:"0px"
            }}>
                
                { this.state.error && <div className="card" style={{
                    padding:"20px",
                    width:"350px",
                    margin:"40px auto",
                    marginBottom: "0px",
                    fontSize:"1.1em"
                }}>
                    <b>Error.</b> { this.state.error }
                </div> }

                { this.state.success && <div className="card" style={{
                    padding:"20px",
                    width:"350px",
                    margin:"40px auto",
                    marginBottom: "0px",
                    fontSize:"1.1em"
                }}>
                    <b>Success.</b> { this.state.success }
                </div> }

                <div className="card" style={{
                    width:"350px",
                    margin: (this.state.error?"20px auto":"100px auto")
                }}>


                    <div className="content">
                        <div className="row">
                            <div className="col-md-12">
                                <div className="form-group">
                                    <label>Email</label>
                                    <input type="email" id="email" className="form-control" onChange={ this.changeHandler }  />
                                </div>
                            </div>
                            <div style={{display:this.state.register?"block":"none"}}>
                                <div className="col-xs-6">
                                    <div className="form-group">
                                        <label>First Name</label>
                                        <input type="text" id="first" className="form-control" onChange={ this.changeHandler } />
                                    </div>
                                </div>
                                <div className="col-xs-6">
                                    <div className="form-group">
                                        <label>Last Name</label>
                                        <input type="text" id="last" className="form-control" onChange={ this.changeHandler } />
                                    </div>
                                </div> 
                                <div className="col-xs-6">
                                    <div className="form-group">
                                        <label>Username</label>
                                        <input type="text" id="username" className="form-control" onChange={ this.changeHandler } />
                                    </div>
                                </div>
                                <div className="col-xs-6">
                                    <div className="form-group">
                                        <label>Date of Birth</label>
                                        <input type="text" id="dob" placeholder="MM/DD/YYYY" className="form-control" onChange={ this.changeHandler } />
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-12">
                                <div className="form-group">
                                    <label>Password</label>
                                    <input type="password" id="password" className="form-control" onChange={ this.changeHandler } />
                                </div>
                            </div>
                        </div>
                        <button type="button" onClick={ this.login } className="btn btn-success btn-block btn-fill">Login</button>
                        <button type="button" onClick={ this.register } className="btn btn-primary btn-block btn-fill">Register</button>
                        <button type="button" onClick={ this.forgot } className="btn btn-warning btn-block btn-fill">Forgot Password</button>


                        <div className="clearfix" />

                    </div>

                </div>
            </div>
        );
    }
}

export default LoginRegister;