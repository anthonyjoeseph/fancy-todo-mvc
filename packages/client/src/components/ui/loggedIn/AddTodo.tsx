import React, { useState, useContext } from 'react';
import { User } from '../../../../../shared/model';
import addTodo from '../../../logic/actions/AddTodo'
import { AppStateContext } from '../../../logic/AppState';

const AddTodo = ({
  user,
}: {
  user: User
}) => {
  const [text, setText] = useState('');
  const [appState, setAppState] = useContext(AppStateContext)
  return (
    <div>
      <form
        onSubmit={e => {
          e.preventDefault()
          if (!text.trim()) {
            return;
          }
          addTodo(
            text,
            user,
            appState,
            setAppState,
          );
        }}
      >
        <input
          type="text"
          aria-label="New Todo Text"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          aria-label="Add Todo"
          type="submit"
        >
          Add Todo
        </button>
      </form>
    </div>
  )
}

export default AddTodo;