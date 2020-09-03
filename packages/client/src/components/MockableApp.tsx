import { pipe } from 'fp-ts/pipeable'
import { flow } from 'fp-ts/function'
import { ordNumber } from 'fp-ts/Ord';
import { getJoinSemigroup } from 'fp-ts/Semigroup';
import * as O from 'fp-ts/Option';
import * as NEA from 'fp-ts/NonEmptyArray';
import * as A from 'fp-ts/Array';
import * as Op from 'monocle-ts/lib/Optional'
import * as Tr from 'monocle-ts/lib/Traversal'
import React, { useState } from 'react'
import { defaultTodos, VisibilityFilter } from '../logic/AppState'
import { routeToVisibilityFilter, visibilityFilterToRoute, parse, format } from '../logic/Location'
import AddTodo from './ui/AddTodo'
import TodoList from './ui/TodoList'
import Footer from './ui/Footer'
import { Todo } from '../../../shared/model';

const MockableApp = ({
  pushUrl,
}: {
  pushUrl: (url: string) => void,
}) => {
  const [todos, setTodos] = useState<Todo[]>(defaultTodos)
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>(
    pipe(
      window.location.pathname,
      parse,
      routeToVisibilityFilter,
    )
  )
  window.addEventListener('popstate', () => pipe(
    window.location.pathname,
    parse,
    routeToVisibilityFilter,
    setVisibilityFilter,
  ))
  const updateVisibilityFilter = (newVisibility: VisibilityFilter) => {
    pipe(
      newVisibility,
      visibilityFilterToRoute,
      format,
      pushUrl,
    )
    setVisibilityFilter(newVisibility)
  }
  return (
    <div>
      <AddTodo
        addTodo={(text) => pipe(
          todos,
          NEA.fromArray,
          O.map(flow(
            NEA.map(t => t.id),
            NEA.fold(getJoinSemigroup(ordNumber)),
            highestID => highestID + 1,
          )),
          O.getOrElse((): number => 0),
          id => A.snoc(
            todos,
            { id, text, completed: false }
          ),
          setTodos,
        )}
      />
      <TodoList
        todos={todos}
        visibility={visibilityFilter}
        toggleTodo={(id) => pipe(
          Op.id<Todo[]>(),
          Op.traverse(A.array),
          Tr.filter(t => t.id === id),
          Tr.prop('completed'),
          Tr.modify(c => !c),
          set => set(todos),
          setTodos,
        )}
      />
      <Footer
        visibilityFilter={visibilityFilter}
        setVisibilityFilter={updateVisibilityFilter}
      />
    </div>
  )
}

export default MockableApp