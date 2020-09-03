import { pipe } from 'fp-ts/pipeable'
import * as O from 'fp-ts/Option'
import * as E from 'fp-ts/Either'
import { LoggedOutLocation, parse, isLoggedOutLocation } from './Location'
import { AppState } from './AppState'

const initializeAppState = (): AppState => {
  const initialLocation = pipe(
    window.location.pathname,
    parse,
  )
  return isLoggedOutLocation(initialLocation)
    ? E.left({
      location: initialLocation,
      redirect: O.none,
      userError: O.none,
    })
    : E.left({
      location: LoggedOutLocation.of.Login({ value: {} }),
      redirect: O.some(initialLocation),
      userError: O.none,
    })
}

export default initializeAppState
