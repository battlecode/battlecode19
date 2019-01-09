import React, { Component } from 'react';
import Api from '../api';

import bc19 from 'bc19/runtime';
import Game from 'bc19/game';
import Compiler from 'bc19/compiler';

import Visualizer from './visualizer';
import Slider from 'rc-slider';


import * as Cookies from "js-cookie";

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

        var l = Cookies.get('lang');
        var t = Cookies.get('theme');
        var ci = Cookies.get('chess_init');
        var ce = Cookies.get('chess_extra');

        this.state = {
            menu:false,
            theater:false,
            logs:[[],[]],
            loading:true,
            error:false,
            errors:'',
            chess_init:(ci ? ci : 100),
            chess_extra:(ce ? ce : 30),
            lang:(l ? l : 'javascript'),
            theme:(t ? t : 'light'),
            vimkeys:Cookies.get('vimkeys'),
            seed:Cookies.get('seed'),
            auto:Cookies.get('auto'),
            numTurns:0,
            turn:null
        };

        this.storage = {};

        this.push = this.push.bind(this);
        this.run = this.run.bind(this);
        this.showMenu = this.showMenu.bind(this);
        this.changeHandler = this.changeHandler.bind(this);
        this.hideSidebar = this.hideSidebar.bind(this);
        this.exitTheater = this.exitTheater.bind(this);
        this.exitErrors = this.exitErrors.bind(this);
        this.changeSlider = this.changeSlider.bind(this);
        this.startStop = this.startStop.bind(this);
    }


    startStop() {
        this.v.startStop();
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
            var hash = t.id + "|" + t.team_key;
            var ref = window.firebase.database().ref().child(hash);
            this.firepad = window.Firepad.fromACE(ref, this.editor);
            this.firepad.on('ready', function() {
                this.setState({loading:false});
            }.bind(this));
        }.bind(this));

        this.editor.commands.addCommand({
            name: 'run',
            bindKey: {win: 'Ctrl-B',  mac: 'Command-B'},
            exec: this.run,
            readOnly: true
        }); this.componentDidUpdate();
    }

    push() {
        Compiler.Compile(this.state.lang, this.firepad.getText(), function(code) {
            Api.pushTeamCode(code, function() {});
        }, function(errors) {
            this.setState({error: true, errors:errors});
        }.bind(this));
    }

    run() {
        this.setState({loading:true});

        Compiler.Compile(this.state.lang, this.firepad.getText(), function(code) {
            this.setState({theater:true, loading:false});
            var seed = (!this.state.seed || this.state.seed === '' || this.state.seed === 0) ? Math.floor(Math.pow(2,31)*Math.random()) : parseInt(this.state.seed,10);
            this.g = new Game(seed, parseInt(this.state.chess_init,10), parseInt(this.state.chess_extra,10), false, true);
            this.v = new Visualizer('viewer', this.g.replay, function(turn) {
                this.setState({turn:turn});
            }.bind(this), 300, 300);
            this.c = new bc19(this.g, null, function(logs) {}, function(logs) {
                // log receiver
                this.setState({logs:logs,numTurns:this.v.numTurns(),turn:this.v.turn});
                this.v.populateCheckpoints();

            }.bind(this));

            this.c.playGame(code, code);
        }.bind(this), function(errors) {
            this.setState({loading:false, error: true, errors:errors});
        }.bind(this));
    }

    changeSlider(turn) {
        if (this.v.running) this.v.startStop();
        this.v.goToTurn(turn);
        this.setState({turn:turn});
    }

    componentDidUpdate() {
        this.editor.resize();
        var element = document.getElementById("redConsole");
        element.scrollTop = element.scrollHeight;
        element = document.getElementById("blueConsole");
        element.scrollTop = element.scrollHeight;

        this.session.setMode("ace/mode/" + this.state.lang);
        this.editor.setTheme("ace/theme/" + this.state.theme);
        this.editor.setOptions({
            enableBasicAutocompletion: this.state.auto==='true',
            enableSnippets: this.state.auto==='true',
            enableLiveAutocompletion: this.state.auto==='true'
        }); this.editor.setKeyboardHandler(this.state.vimkeys);
    }

    exitTheater() {
        this.c.destroy();
        this.c = null;
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
        
        Cookies.set(id, val);
        this.setState(function(prev, props) {
            prev[id] = val;
            return prev;
        });
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

                    <div id="viewer" style={{
                        position:"absolute",
                        top:"20px",
                        left:"calc(50% - 150px)",
                        width:"calc(100% - 40px)",
                        height:"60%",
                    }}></div>
                    <Slider style={{
                        display:(this.v == null)?'none':'block',
                        width:'80%',
                        left:'10%',
                        position:'absolute',
                        top:'340px'
                    }} max={this.state.numTurns} onChange={this.changeSlider} value={this.state.turn} />
                    <button style={{
                        display:(this.v == null)?'none':'block',
                        width:'80%',
                        position:'absolute',
                        left:'10%',
                        top:'360px'
                    }} onClick={this.startStop}>START/STOP</button>


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
                            <select className="form-control" id="lang" value={ this.state.lang } onChange={ this.changeHandler }>
                                <option value='javascript'>Javascript</option>
                                <option value='python'>Python</option>
                                <option value='java'>Java</option>
                            </select>
                        </div>
                        <div className="form-group" style={{padding:"10px", marginTop:"-20px"}}>
                            <label>Theme</label>
                            <select className="form-control" id="theme" value={ this.state.theme }  onChange={ this.changeHandler }>
                                <option value='textmate'>Light</option>
                                <option value='monokai'>Dark</option>
                            </select>
                        </div>
                        <div className="form-group" style={{padding:"10px", marginTop:"-20px"}}>
                            <label>Autocomplete</label>
                            <select className="form-control" id="auto"  value={ this.state.auto } onChange={ this.changeHandler }>
                                <option value={false}>Off</option>
                                <option value={true}>On</option>
                            </select>
                        </div>
                        <div className="form-group" style={{padding:"10px", marginTop:"-20px"}}>
                            <label>Vimkeys</label>
                            <select className="form-control" id="vimkeys" value={ this.state.vimkeys } onChange={ this.changeHandler }>
                                <option value="">Off</option>
                                <option value="ace/keyboard/vim">On</option>
                            </select>
                        </div>
                        <div className="form-group" style={{padding:"10px", marginTop:"-20px"}}>
                            <label>Mapgen Seed</label>
                            <input className="form-control" id="seed"  value={ this.state.seed } onChange={ this.changeHandler } />
                        </div>
                        <div className="form-group" style={{padding:"10px", marginTop:"-20px"}}>
                            <label>Chess Timer</label>
                            <input className="form-control" style={{width:'45%', 'float':'left'}} id="chess_init" value={this.state.chess_init} onChange={ this.changeHandler } />
                            <input className="form-control" style={{width:'45%', 'float':'right'}} id="chess_extra" value={this.state.chess_extra} onChange={ this.changeHandler } />
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