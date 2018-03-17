import { RSAA } from 'redux-api-middleware';
import { withAuth } from '../reducers/index'

export const USERS_REQUEST = '@@users/USERS_REQUEST';
export const USERS_SUCCESS = '@@users/USERS_SUCCESS';
export const USERS_FAILURE = '@@users/USERS_FAILURE';

export const fetchUsers = () => ({
  [RSAA]: {
    endpoint: '/bapi/users/',
    method: 'GET',
    headers: withAuth(),
    types: [USERS_REQUEST, USERS_SUCCESS, USERS_FAILURE]
  }
})
