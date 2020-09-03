import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/pipeable'
import { LoggedInLocation } from '../../../logic/Location'
import { APIError, UserError, AppStateContext } from '../../../logic/AppState'
import React, { useContext, useState } from 'react'
import login from '../../../logic/actions/Login'

const Login = ({
  redirect,
  userError
}: {
  redirect: O.Option<LoggedInLocation>
  userError: O.Option<UserError>
}) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [appState, setAppState, setLocation] = useContext(AppStateContext)
  return (
    <div>
      email
      <input
        type="text"
        aria-label="Email"
        value={email}
        style={{
          backgroundColor: pipe(
            userError,
            O.chain(O.fromPredicate(UserError.is.NoUser)),
            O.map(() => 'red'),
            O.toUndefined,
          )
        }}
        onChange={(e) => setEmail(e.target.value)}
      />
      <br/>
      password
      <input
        type="text"
        aria-label="Password"
        value={password}
        style={{
          backgroundColor: pipe(
            userError,
            O.chain(O.fromPredicate(UserError.is.BadPassword)),
            O.map(() => 'red'),
            O.toUndefined,
          )
        }}
        onChange={(e) => setPassword(e.target.value)}
      />
      <br/>
      name (only for signing up)
      <input
        type="text"
        aria-label="User's Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <br/>
      <button
        aria-label="Add Todo"
        onClick={() => login(
          email,
          password,
          O.none,
          redirect,
          appState,
          setAppState,
          setLocation,
        )}
      >
        Login
      </button>
      <br />
      <button
        aria-label="Add Todo"
        onClick={() => login(
          email,
          password,
          O.some(name),
          redirect,
          appState,
          setAppState,
          setLocation,
        )}
      >
        Sign Up
      </button>
      {pipe(
        userError,
        O.map(e => e as APIError),
        O.chain(O.fromPredicate(APIError.verified)),
        O.map(APIError.matchStrict<string | undefined>({
          Network: () => 'network error',
          Parse: () => 'parse error',
        })),
        O.toUndefined,
      )}
    </div>
  )
}

export default Login
