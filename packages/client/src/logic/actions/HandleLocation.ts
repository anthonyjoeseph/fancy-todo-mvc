import { pipe } from 'fp-ts/pipeable'
import * as O from 'fp-ts/Option'
import * as E from 'fp-ts/Either'
import { Location, isLoggedOutLocation, LoggedOutLocation } from '../Location'
import { AppState } from '../AppState'

const handleLocation = (
  state: AppState,
  setState: (s: AppState) => void,
  setLocation: (l: Location) => void,
) => (
  location: Location
): void => {
  if (isLoggedOutLocation(location)) {
    setState(pipe(
      state,
      E.fold(
        (loggedOut): AppState => E.left({
          redirect: loggedOut.redirect,
          userError: loggedOut.userError,
          location,
        }),
        (loggedIn): AppState => E.right({
          todos: loggedIn.todos,
          user: loggedIn.user,
          location,
        }),
      ),
    ))
    setLocation(location)
  } else {
    if (E.isLeft(state)) {
      setState(E.left({
        location: LoggedOutLocation.of.Login({ value: {} }),
        redirect: O.some(location),
        userError: state.left.userError
      }))
      setLocation(LoggedOutLocation.of.Login({ value: {} }))
    } else {
      setState(E.right({
        location: location,
        todos: state.right.todos,
        user: state.right.user,
      }))
    }
  }
}

export default handleLocation
