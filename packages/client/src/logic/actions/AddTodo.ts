import { pipe } from "fp-ts/pipeable"
import * as A from 'fp-ts/Array'
import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import * as Op from 'monocle-ts/lib/Optional'
import { User } from "../../../../shared/model"
import { AppState } from "../AppState"
import { addTodo as addTodoBackend } from '../Backend'

const addTodo = (
  text: string,
  user: User,
  appState: AppState,
  setAppState: (a: AppState) => void
): void => {
  pipe(
    addTodoBackend(user.id, text),
    TE.map(newTodo => pipe(
      appState,
      pipe(
        Op.id<AppState>(),
        Op.right,
        Op.prop('todos'),
        Op.right,
        Op.modify(t => A.snoc(t, newTodo))
      ),
      setAppState
    )),
    TE.mapLeft(err => pipe(
      appState,
      pipe(
        Op.id<AppState>(),
        Op.right,
        Op.prop('todos'),
      ).set(E.left(err)),
      setAppState,
    )),
    invokeTask => invokeTask(),
  )
}

export default addTodo
