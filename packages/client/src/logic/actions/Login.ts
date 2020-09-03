import { pipe } from "fp-ts/pipeable"
import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import * as Op from 'monocle-ts/lib/Optional'
import * as O from 'fp-ts/Option'
import { Do } from 'fp-ts-contrib/lib/Do'
import { LoggedInLocation, ExistingLocation } from '../Location'
import { AppState } from '../AppState'
import { addUser, loginUser, getTodos } from '../Backend'

const login = (
  email: string,
  password: string,
  name: O.Option<string>,
  redirect: O.Option<LoggedInLocation>,
  appState: AppState,
  setAppState: (state: AppState) => void,
  setLocation: (location: ExistingLocation) => void,
) => {
  pipe(
    Do(TE.taskEither)
      .bind('user', pipe(
        name,
        O.map(name => addUser(email, password, name)),
        O.getOrElse(() => loginUser(email, password)),
      ))
      .bindL('todos', ({ user: { id } }) => getTodos(id))
      .return(({
        todos,
        user,
      }) => {
        const newLocation = pipe(
          redirect,
          O.getOrElse(() => LoggedInLocation.of.AllTodos({ value: { userid: user.id } })),
        )
        const newAppState: AppState = E.right({
          location: newLocation,
          todos: E.right(todos),
          user,
        })
        setAppState(newAppState)
        setLocation(newLocation)
      }),
    TE.mapLeft(err => pipe(
      appState,
      pipe(
        Op.id<AppState>(),
        Op.left,
        Op.prop('userError'),
      ).set(O.some(err)),
      setAppState,
    )),
    invokeTask => invokeTask(),
  )
}

export default login