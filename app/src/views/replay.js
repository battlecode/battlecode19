import React, { Component } from 'react';
import Coldsys from 'coldbrew';
import Api from '../api';

var Visualizer = Coldsys.Visualizer;

class ReplayViewer extends Component {
    constructor() {
        super();
        this.state = {logs:[[],[]]}
    }
    componentDidMount() {
        Api.getReplayFromURL(window.location.href.split("?")[1], function(replay) {
            this.vis = new Visualizer("viewer", null, null, null, replay);
            this.setState({logs:replay.logs});
        }.bind(this));
    }

    render() {
        return (
            <div className="content">
                <div className="content">
                    <div className="container-fluid">
                        <div className="row">
                            <canvas id="viewer" style={{
                                position:"absolute",
                                top:"80px",
                                left:"20px",
                                width:"calc(100% - 40px)",
                                height:"calc(70% - 160px)",
                                border:"1px solid #ddd"
                            }}></canvas>
                            <div id="console" style={{
                                position:"absolute",
                                top:"calc(70% - 70px)",
                                left:"20px",
                                width:"calc(100% - 40px)",
                                height:"calc(30% - 10px)",
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
                    </div>
                </div>
            </div>
        );
    }
}

export default ReplayViewer;