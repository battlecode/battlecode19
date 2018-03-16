import React from "react"

import Headline from "../components/Headline"

export default class AppContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      loaded: false,
      placeholder: 'Loading...',
    }
  }

  componentWillMount() {
    fetch('/api/users/', {method: 'GET'})
    .then(response => {
      if (response.status !== 200) {
        return this.setState({
          placeholder: 'Something went wrong.',
        });
      } else {
        return response.json()
      }
    })
    .then(data => this.setState({ data: data.results, loaded: true, placeholder: 'Loaded' }));
  }

  render() {
    const userList = (
      <ul>
        {this.state.data.map(user => (
          <li>Contact {user.first_name} {user.last_name} at {user.email}.</li>
        ))}
      </ul>
    )

    return (
      <div className="container">
        <div className="row">
          <div className="col-sm-12">
            <Headline>Sample App!</Headline>
            <p>{this.state.placeholder}</p>
            {userList}
          </div>
        </div>
      </div>
    )
  }
}
