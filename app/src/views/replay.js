import React, { Component } from 'react';
import Api from '../api';
import Visualizer from './visualizer';

class ReplayViewer extends Component {
    componentDidMount() {
        new Visualizer('c', []);
    }

    render() {
        return (
            <div className="content">
                <canvas id="c" />
            </div>
        );
    }
}

export default ReplayViewer;