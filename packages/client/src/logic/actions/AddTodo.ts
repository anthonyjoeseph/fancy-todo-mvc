import { pipe } from "fp-ts/pipeable"
import * as A from 'fp-ts/Array'
import * as E from 'fp-ts/Either'
import * as T from 'fp-ts/Task'
import * as Op from 'monocle-ts/lib/Optional'
import { User } from "shared-todo/model"
import { AppState } from "../AppState"
import { addTodo as addTodoBackend } from '../Backend'

const addTodo = (
  text: string,
  user: User,
  appState: AppState,
  setAppState: (a: AppState) => void
): Promise<void> => pipe(
  addTodoBackend(user.id, text),
  T.map(E.fold(
    err => pipe(
      appState,
      pipe(
        Op.id<AppState>(),
        Op.right,
        Op.prop('todos'),
      ).set(E.left(err)),
      setAppState,
    ),
    newTodo => pipe(
      appState,
      pipe(
        Op.id<AppState>(),
        Op.right,
        Op.prop('todos'),
        Op.right,
        Op.modify(t => A.snoc(t, newTodo))
      ),
      setAppState,
    )
  )),
  invokeTask => invokeTask(),
)

export default addTodo
