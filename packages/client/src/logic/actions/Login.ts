import { pipe } from "fp-ts/pipeable"
import * as E from 'fp-ts/Either'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import * as Op from 'monocle-ts/lib/Optional'
import * as O from 'fp-ts/Option'
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
): Promise<void> => pipe(
  name,
  O.map(name => addUser(email, password, name)),
  O.getOrElse(() => loginUser(email, password)),
  TE.bindTo('user'),
  TE.bind('todos', ({ user: { id } }) => getTodos(id)),
  TE.map(({
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
    return undefined;
  }),
  T.map(E.getOrElse(err => pipe(
    appState,
    pipe(
      Op.id<AppState>(),
      Op.left,
      Op.prop('userError'),
    ).set(O.some(err)),
    setAppState,
  ))),
  invokeTask => invokeTask(),
)

export default login