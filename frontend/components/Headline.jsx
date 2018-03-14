import React from "react"

export default class Headline extends React.Component {
  render() {
    return (
      <h1>{ this.props.children }</h1>
    )
  }
}
