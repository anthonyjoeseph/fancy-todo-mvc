import * as O from 'fp-ts/Option'
import React from 'react'
import AddTodo from './loggedIn/AddTodo'
import TodoList from './loggedIn/TodoList'
import Footer from './loggedIn/Footer'
import { LoggedIn as LoggedInType } from '../../logic/AppState'
import { isLoggedOutLocation } from '../../logic/Location'
import LoggedOut from './LoggedOut'

const LoggedIn = ({
  loggedIn: {
    location,
    todos,
    user
  }
}: {
  loggedIn: LoggedInType
}) => isLoggedOutLocation(location)
  ? (
    <LoggedOut
      loggedOut={{
        location,
        redirect: O.none,
        userError: O.none,
      }}
    />
  )
  : (
    <div>
      <AddTodo
        user={user}
      />
      <TodoList
        todos={todos}
        location={location}
      />
      <Footer
        location={location}
        user={user}
      />
    </div>
  )

export default LoggedIn
