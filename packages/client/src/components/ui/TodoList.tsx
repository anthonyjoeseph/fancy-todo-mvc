import React from 'react';
import TodoComponent from './Todo';
import { VisibilityFilter } from '../../logic/AppState';
import { Todo as TodoType } from '../../../../shared/model'

const TodoList = ({
  todos,
  visibility,
  toggleTodo
}: {
  todos: TodoType[];
  visibility: VisibilityFilter;
  toggleTodo: (id: number) => void;
}) => {
  let visibileTodos: TodoType[];
  switch (visibility) {
    case 'SHOW_ALL':
      visibileTodos = todos;
      break;
    case 'SHOW_ACTIVE':
      visibileTodos = todos.filter(t => !t.completed);
      break;
    case 'SHOW_COMPLETED':
      visibileTodos = todos.filter(t => t.completed);
      break;
  }
  return (
    <ul>
      {visibileTodos.map(todo => (
        <TodoComponent
          key={todo.id}
          {...todo}
          onClick={() => toggleTodo(todo.id)}
        />
      ))}
    </ul>
  )
}

export default TodoList;