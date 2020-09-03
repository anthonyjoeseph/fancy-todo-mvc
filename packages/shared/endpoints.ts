import * as t from 'io-ts'

// user

export const LoginUser = t.strict({
  email: t.string,
  password: t.string
})
export const loginUserEndpoint = '/user'

export const AddUser = t.strict({
  email: t.string,
  password: t.string,
  name: t.string
})
export const addUserEndpoint = '/user/add'

export const DeleteUser = t.strict({
  userid: t.number,
  password: t.string
})
export const deleteUserEndpoint = '/user/delete'


// todo

export const GetTodos = t.strict({
  userid: t.number
})
export const getTodosEndpoint = '/todo'

export const ToggleTodoComplete = t.strict({
  todoid: t.number
})
export const toggleCompleteEndpoint = '/todo/toggle-complete'

export const AddTodo = t.strict({
  userid: t.number,
  text: t.string
})
export const addTodoEndpoint = '/todo/add'

export const DeleteTodo = t.strict({
  todoid: t.number
})
export const deleteTodoEndpoint = '/todo/delete'
