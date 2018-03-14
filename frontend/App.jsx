import React from "react"
import { render } from "react-dom"

import App1Container from "./containers/App1Container"

class App1 extends React.Component {
  render() {
    return (
      <App1Container />
    )
  }
}

render(<App1/>, document.getElementById('App1'))
