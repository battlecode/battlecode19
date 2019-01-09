import 'rc-slider/assets/index.css';
import React, { Component } from 'react';
import Api from '../api';
import Visualizer from './visualizer';
import ReactDropzone from 'react-dropzone';
import Slider from 'rc-slider';

class ReplayViewer extends Component {
    constructor(props) {
        super(props);

        this.onDrop = this.onDrop.bind(this);
        this.changeSlider = this.changeSlider.bind(this);
        this.startStop = this.startStop.bind(this);

        this.state = {
            turn:null,
            numTurns:0
        };
    }

    componentDidMount() {
        // Check for ? in url, if so, grab replay url
        var url = window.location.href.split('?');

        if (url.length === 2) {
            var replay_url = url[url.length-1];

            Api.getReplayFromURL(replay_url, function(replay) {
                this.v = new Visualizer("pixi", replay, function(turn) {
                    this.setState({turn:turn});
                }.bind(this));
                this.setState({numTurns:this.v.numTurns()});
            }.bind(this));
        }
    }

    onDrop(files) {
        var reader = new FileReader();
        reader.onload = function() {
            this.v = new Visualizer("pixi", new Uint8Array(reader.result), function(turn) {
                this.setState({turn:turn});
            }.bind(this));
            this.setState({numTurns:this.v.numTurns()});
        }.bind(this);

        reader.readAsArrayBuffer(files[0]);
    }

    changeSlider(turn) {
        if (this.v) {
            this.v.goToTurn(turn);
            this.setState({turn:turn});
        }
    }

    startStop() {
        this.v.startStop();
    }

    render() {
        return (
            <div className="content">
                <div id="pixi"></div>
                <Slider style={{display:(this.v == null)?'none':'block', 'width':'100%'}} max={this.state.numTurns} onChange={this.changeSlider} value={this.state.turn} />
                <button style={{display:(this.v == null)?'none':'block'}} onClick={this.startStop}>START/STOP</button>
                <ReactDropzone onDrop={this.onDrop}>
                    {({getRootProps, getInputProps}) => (
                        <div {...getRootProps()}>
                            <input {...getInputProps()} />
                            <p>Drop files here, or click to select files</p>
                        </div>
                    )}
                </ReactDropzone>
            </div>
        );
    }
}

export default ReplayViewer;