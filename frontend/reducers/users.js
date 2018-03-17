import * as users from '../actions/users'

const initialState = {
  users: [],
  placeholder: 'Loading...'
}

export default (state=initialState, action) => {
  switch(action.type) {
    case users.USERS_SUCCESS:
      return {
        users: action.payload.results,
        placeholder: 'Loaded!'
      }
    default:
      return state
  }
}

export const serverMessage = (state) => state.users
