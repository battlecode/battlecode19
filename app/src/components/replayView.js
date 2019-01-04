import React, { Component } from 'react';
import Coldsys from 'coldbrew';
import { Stage } from "react-pixi-fiber";


class replayView extends Component {
    state = {
        game: new Coldsys.Game(),
        nextAction: null,
        isPlaying: false,
        round: 0,
    }

    render() {
        return (
            <div class="replay-container">
                <Stage>
                    
                </Stage>
            </div>
        )
    }
}

export default replayView;