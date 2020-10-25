import { pipe } from 'fp-ts/pipeable'
import { identity, flow } from 'fp-ts/function'
import * as E from 'fp-ts/Either'
import * as A from 'fp-ts/Array'
import React, { useContext } from 'react'
import TodoComponent from './Todo'
import { APIError, AppStateContext } from '../../../logic/AppState'
import { Todo as TodoType, Todo } from 'shared-todo/model'
import { LoggedInLocation } from '../../../logic/Location'
import toggleTodo from '../../../logic/actions/ToggleTodo'

const TodoList = ({
  todos,
  location
}: {
  todos: E.Either<APIError, TodoType[]>
  location: LoggedInLocation
}) => {
  const [appState, setAppState] = useContext(AppStateContext);
  return pipe(
    todos,
    E.map(pipe(
      location,
      LoggedInLocation.matchStrict<(t: Todo[]) => Todo[]>({
        AllTodos: () => identity,
        ActiveTodos: () => A.filter(t => !t.completed),
        CompletedTodos: () => A.filter(t => t.completed),
      })
    )),
    E.fold(
      flow(
        APIError.matchStrict({
          Network: () => 'network error',
          Parse: () => 'parse error',
        }),
        message => (
          <div>
            cannot display todos due to Error:
            <br/>
            {message}
          </div>
        )
      ),
      flow(
        A.map((todo): JSX.Element => (
          <TodoComponent
            key={todo.id}
            {...todo}
            onClick={() => toggleTodo(
              todo.id,
              appState,
              setAppState,
            )}
          />
        )),
        listComponents => (
          <ul>{listComponents}</ul>
        )
      )
    ),
  )
}

export default TodoList