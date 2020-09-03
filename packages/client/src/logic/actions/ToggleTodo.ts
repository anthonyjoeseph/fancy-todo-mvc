import { pipe } from "fp-ts/pipeable"
import * as A from 'fp-ts/Array'
import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import * as Op from 'monocle-ts/lib/Optional'
import * as Tr from 'monocle-ts/lib/Traversal'
import { AppState } from "../AppState"
import { toggleTodo as toggleTodoBackend } from "../Backend"

const toggleTodo = (
  todoid: number,
  appState: AppState,
  setAppState: (s: AppState) => void,
): void => {
  pipe(
    toggleTodoBackend(todoid),
    TE.map(() => pipe(
      appState,
      pipe(
        Op.id<AppState>(),
        Op.right,
        Op.prop('todos'),
        Op.right,
        Op.traverse(A.array),
        Tr.filter(a => a.id === todoid),
        Tr.prop('completed'),
        Tr.modify(a => !a),
      ),
      setAppState,
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

export default toggleTodo
