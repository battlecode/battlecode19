import React, { Component } from 'react';
import Coldsys from 'coldbrew';
import Api from '../api';

var Visualizer = Coldsys.Visualizer;

class ReplayViewer extends Component {
    componentDidMount() {
        Api.getReplayFromURL(window.location.href.split("?")[1], function(replay) {
            this.vis = new Visualizer("viewer", null, null, null, replay);
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
                                height:"calc(100% - 160px)",
                                border:"1px solid #ddd"
                            }}></canvas>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default ReplayViewer;