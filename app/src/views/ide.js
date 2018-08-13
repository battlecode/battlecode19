/* eslint-disable import/first */

import React, { Component } from 'react';
import Api from '../api';
import Coldbrew from '../coldbrew/runtime';
import Compiler from '../coldbrew/compiler'

var firebase_config = {
    apiKey: "AIzaSyBT7Mu9Bw6UH0Tr-mKXMwhKjdnLppdjvA4",
    authDomain: "battlecode18.firebaseapp.com",
    databaseURL: "https://battlecode18.firebaseio.com",
    projectId: "battlecode18",
    storageBucket: "battlecode18.appspot.com",
    messagingSenderId: "323934682061"
};

window.ace.require("ace/ext/language_tools");
window.firebase.initializeApp(firebase_config);

class IDE extends Component {
    constructor() {
        super();
        this.state = {menu:false, theater:false, logs:[[],[]], loading:false, error:false, errors:''};

        this.lang = 'javascript';
        this.storage = {};

        this.pull = this.pull.bind(this);
        this.push = this.push.bind(this);
        this.run = this.run.bind(this);
        this.showMenu = this.showMenu.bind(this);
        this.changeHandler = this.changeHandler.bind(this);
        this.hideSidebar = this.hideSidebar.bind(this);
        this.exitTheater = this.exitTheater.bind(this);
        this.exitErrors = this.exitErrors.bind(this);
    }

    componentDidMount() {
        this.editor = window.ace.edit("firepad-container");
        this.session = this.editor.getSession();
        this.session.setUseWorker(false);
        this.session.setMode("ace/mode/javascript");
        this.session.setUseSoftTabs(true);
        this.session.setTabSize(4);
        this.editor.setShowPrintMargin(false);

        Api.getUserTeam(function(t) {
            var hash = t.team_id + "|" + t.secret_key;
            var ref = window.firebase.database().ref().child(hash);
            this.firepad = window.Firepad.fromACE(ref, this.editor);
        }.bind(this));

        this.editor.resize();
        this.editor.commands.addCommand({
            name: 'run',
            bindKey: {win: 'Ctrl-B',  mac: 'Command-B'},
            exec: this.run,
            readOnly: true
        });
    }

    pull() {
        Api.fetchTeamCode(function(code) {
            this.firepad.setText(code);
        }.bind(this));
    }

    push() {
        Compiler.Compile(this.lang, this.firepad.getText(), function(code) {
            Api.pushTeamCode(code, function() {});
        }.bind(this), function(errors) {
            this.setState({error: true, errors:errors});
        }.bind(this));
    }

    run() {
        this.setState({loading:true});

        Compiler.Compile(this.lang, this.firepad.getText(), function(code) {
            this.setState({theater:true, loading:false});
            this.c = new Coldbrew("viewer", Math.floor(10000*Math.random()));
            this.c.playGame(code,code, function(logs) {
                this.setState({logs:logs});
            }.bind(this));
        }.bind(this), function(errors) {
            this.setState({loading:false, error: true, errors:errors});
        }.bind(this));
    }

    componentDidUpdate() {
        this.editor.resize();
        var element = document.getElementById("redConsole");
        element.scrollTop = element.scrollHeight;
        element = document.getElementById("blueConsole");
        element.scrollTop = element.scrollHeight;
    }

    exitTheater() {
        this.c.destroy();
        this.setState({theater:false});
    }

    exitErrors() {
        this.setState({error:false, errors:''});
    }

    showMenu() {
        this.setState(function(prev,props) {
            prev.menu = !prev.menu;
            return prev;
        });
    }

    changeHandler(e) {
        var id = e.target.id;
        var val = e.target.value;

        if (id === "lang") {
            this.session.setMode("ace/mode/" + val);
            this.lang = val;
        }

        else if (id === "theme") this.editor.setTheme("ace/theme/" + val);
        else if (id === "tab") this.session.setTabSize(val);
        else if (id === "auto") this.editor.setOptions({
            enableBasicAutocompletion: val,
            enableSnippets: val,
            enableLiveAutocompletion: val
        }); else if (id === "vimkeys") this.editor.setKeyboardHandler(val);
    }

    hideSidebar() {
        this.setState({menu:false});
    }

    render() {
        return (
            <div className="content" style={{
                width:"100%",
                height:"calc(100% - 1000px)",
                padding:"0px",
                overflow:"hidden"
            }}>
                <div style={{
                    width:"100%",
                    height:"100%",
                    position:"absolute",
                    top:"0px",
                    opacity:(this.state.theater||this.state.error||this.state.loading)?"0.8":"0",
                    backgroundColor:"#000",
                    zIndex:"100",
                    visibility:(this.state.theater||this.state.error||this.state.loading)?"visible":"hidden",
                    transition:"opacity 500ms ease, visibility 500ms ease",
                }}></div>

                <div style={{
                    top:"calc(50% - 35px)",
                    left:"calc(50% - 35px)",
                    position:"absolute",
                    zIndex:"101",
                    visibility:this.state.loading?"visible":"hidden",
                    transition:"visibility 500ms ease",
                    width:"70px",
                    height:"70px"
                }} className='sk-circle'>
                  <div className="sk-circle1 sk-child"></div>
                  <div className="sk-circle2 sk-child"></div>
                  <div className="sk-circle3 sk-child"></div>
                  <div className="sk-circle4 sk-child"></div>
                  <div className="sk-circle5 sk-child"></div>
                  <div className="sk-circle6 sk-child"></div>
                  <div className="sk-circle7 sk-child"></div>
                  <div className="sk-circle8 sk-child"></div>
                  <div className="sk-circle9 sk-child"></div>
                  <div className="sk-circle10 sk-child"></div>
                  <div className="sk-circle11 sk-child"></div>
                  <div className="sk-circle12 sk-child"></div>
                </div>

                <div style={{
                    width:"calc(100% - 50px)",
                    height:"calc(100% - 50px)",
                    position:"absolute",
                    top:this.state.error?"25px":"-2000px",
                    right:"25px",
                    backgroundColor:"#fff",
                    zIndex:"101",
                    visibility:this.state.error?"visible":"hidden",
                    transition:"top 500ms ease, visibility 500ms ease",
                }}>
                    <i className="pe-7s-close-circle" style={{
                        position:"absolute",
                        top:"-15px",
                        right:"-15px",
                        fontSize:"1.5em",
                        cursor:"pointer",
                        border:"10px solid #fff",
                        backgroundColor:"#fff",
                        borderRadius:"20px"
                    }} onClick={ this.exitErrors }/>
                    <pre id="console" style={{
                        position:"absolute",
                        top:"30px",
                        left:"20px",
                        width:"calc(100% - 40px)",
                        height:"calc(100% - 50px)",
                        backgroundColor:"#333",
                        color:"#fff",
                        fontFamily:"Roboto Mono, monospace",
                        padding: "20px",
                        fontSize:"0.9em"
                    }}>
                    { this.state.errors }
                    </pre>
                </div>

                <div style={{
                    width:"calc(100% - 50px)",
                    height:"calc(100% - 50px)",
                    position:"absolute",
                    top:this.state.theater?"25px":"-2000px",
                    right:"25px",
                    backgroundColor:"#fff",
                    zIndex:"101",
                    visibility:this.state.theater?"visible":"hidden",
                    transition:"top 500ms ease, visibility 500ms ease",
                }}>
                    <i className="pe-7s-close-circle" style={{
                        position:"absolute",
                        top:"-15px",
                        right:"-15px",
                        fontSize:"1.5em",
                        cursor:"pointer",
                        border:"10px solid #fff",
                        backgroundColor:"#fff",
                        borderRadius:"20px"
                    }} onClick={ this.exitTheater }/>

                    <canvas id="viewer" style={{
                        position:"absolute",
                        top:"20px",
                        left:"20px",
                        width:"calc(100% - 40px)",
                        height:"60%",
                        border:"1px solid #ddd"
                    }}></canvas>

                    <div id="console" style={{
                        position:"absolute",
                        top:"calc(60% + 30px)",
                        left:"20px",
                        width:"calc(100% - 40px)",
                        height:"calc(40% - 50px)",
                        backgroundColor:"#333",
                        color:"#fff",
                        fontFamily:"Roboto Mono, monospace",
                        fontSize:"0.9em"
                    }}>
                        <div id="redConsole" style={{
                            width:"calc(50% - 3px)",
                            position:"absolute",
                            left:"0px",
                            top:"0px",
                            height:"100%",
                            borderLeft:"3px solid red",
                            padding:"10px",
                            overflow:"scroll"
                        }}>
                            { this.state.logs[0].map((log, idx) => 
                                <span key={ idx }>
                                    <span style={{color:log.type==="error"?"red":"green"}}>[Robot { log.robot }{log.type==='error'?' Error':''}]</span> {log.message}
                                <br /></span>
                            )}
                        </div>
                        <div id="blueConsole" style={{
                            width:"calc(50% - 3px)",
                            height:"100%",
                            borderLeft:"3px solid blue",
                            position:"absolute",
                            top:"0px",
                            left:"50%",
                            padding:"10px",
                            overflow:"scroll"
                        }}>
                            { this.state.logs[1].map((log, idx) => 
                                <span key={ idx }>
                                    <span style={{color:log.type==="error"?"red":"green"}}>[Robot { log.robot }{log.type==='error'?' Error':''}]</span> {log.message}
                                <br /></span>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{
                    width:this.state.menu?"calc(100%-200px)":"100%",
                    borderBottom:"1px solid #ddd",
                    padding:"2px 10px 0px 10px",
                    fontSize:"1.2em"
                }}>
                    <i onClick={ this.showMenu } style={{cursor:"pointer"}} className="pe-7s-menu" />
                    <i onClick={ this.run } className="pe-7s-play pull-right" style={{cursor:"pointer", marginTop:"2px"}} />
                    <i onClick={ this.pull } className="pe-7s-download" style={{marginLeft:"10px", cursor:"pointer"}} />
                    <i onClick={ this.push } className="pe-7s-upload" style={{marginLeft:"10px", cursor:"pointer"}} />
                </div>
                <div style={{
                    width:"100%",
                    height:"calc(100% - 30px)",
                    overflow:"hidden"
                }}>
                    <div style={{
                        width:this.state.menu?"150px":"0px",
                        height:"500px",
                        position:"absolute",
                        left:"0px",
                        float:"left",
                        overflow:"hidden",
                        transitionProperty:"width",
                        transitionDuration:"500ms",
                        zIndex:"50"
                    }}>
                        <div className="form-group" style={{padding:"10px"}}>
                            <label>Language</label>
                            <select className="form-control" id="lang" onChange={ this.changeHandler }>
                                <option value='javascript'>Javascript</option>
                                <option value='python'>Python</option>
                                <option value='java'>Java</option>
                            </select>
                        </div>
                        <div className="form-group" style={{padding:"10px", marginTop:"-20px"}}>
                            <label>Theme</label>
                            <select className="form-control" id="theme" onChange={ this.changeHandler }>
                                <option value='textmate'>Light</option>
                                <option value='monokai'>Dark</option>
                            </select>
                        </div>
                        <div className="form-group" style={{padding:"10px", marginTop:"-20px"}}>
                            <label>Tab Size</label>
                            <select className="form-control" id="tab" onChange={ this.changeHandler }>
                                <option value={4}>4 spaces</option>
                                <option value={3}>3 spaces</option>
                                <option value={2}>2 spaces</option>
                            </select>
                        </div>
                        <div className="form-group" style={{padding:"10px", marginTop:"-20px"}}>
                            <label>Autocomplete</label>
                            <select className="form-control" id="auto" onChange={ this.changeHandler }>
                                <option value={false}>Off</option>
                                <option value={true}>On</option>
                            </select>
                        </div>
                        <div className="form-group" style={{padding:"10px", marginTop:"-20px"}}>
                            <label>Vimkeys</label>
                            <select className="form-control" id="vimkeys" onChange={ this.changeHandler }>
                                <option value="">Off</option>
                                <option value="ace/keyboard/vim">On</option>
                            </select>
                        </div>
                    </div>
                    <div id="firepad-container" style={{
                        width:this.state.menu?"calc(100%-150px)":"100%",
                        height:"100%",
                        position:"absolute",
                        top:"0px",
                        left:this.state.menu?"150px":"0px",
                        transitionProperty:"left",
                        transitionDuration:"500ms"
                    }} onClick={ this.hideSidebar }></div>
                </div>
            </div>
        );
    }
}

export default IDE;