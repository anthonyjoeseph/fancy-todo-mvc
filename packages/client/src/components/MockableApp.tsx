import { pipe } from 'fp-ts/pipeable'
import { flow } from 'fp-ts/function'
import * as E from 'fp-ts/Either'
import React, { useState } from 'react'
import { AppState, AppStateContext } from '../logic/AppState'
import { parse, format } from '../logic/Location'
import initializeAppState from '../logic/initializeAppState'
import handleLocation from '../logic/actions/HandleLocation'
import LoggedOut from './ui/LoggedOut'
import LoggedIn from './ui/LoggedIn'

const MockableApp = ({
  pushUrl,
}: {
  pushUrl: (url: string) => void,
}) => {
  const [state, setState] = useState<AppState>(initializeAppState())
  const setLocation = handleLocation(state, setState, flow(format, pushUrl))
  window.addEventListener('popstate', () => pipe(
    window.location.pathname,
    parse,
    setLocation
  ))
  return (
    <AppStateContext.Provider value={[state, setState, setLocation]}>
      {pipe(
        state,
        E.fold(
          loggedOut => (
            <LoggedOut
              loggedOut={loggedOut}
            />
          ),
          loggedIn => (
            <LoggedIn
              loggedIn={loggedIn}
            />
          )
        )
      )}
    </AppStateContext.Provider>
  )
}

export default MockableApp