import React from 'react'
import { LoggedOut as LoggedOutType } from '../../logic/AppState'
import { LoggedOutLocation } from '../../logic/Location'
import Landing from './loggedOut/Landing'
import Login from './loggedOut/Login'

const LoggedOut = ({
  loggedOut: {
    location,
    redirect,
    userError,
  }
}: {
  loggedOut: LoggedOutType
}) => LoggedOutLocation.matchStrict({
  Landing: () => (
    <Landing />
  ),
  Login: () => (
    <Login
      redirect={redirect}
      userError={userError}
    />
  ),
  NotFound: () => (
    <Landing />
  ),
})(location)

export default LoggedOut
