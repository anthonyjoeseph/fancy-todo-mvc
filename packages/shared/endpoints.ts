import * as t from 'io-ts'

// user

export const LoginUser = t.strict({
  email: t.string,
  password: t.string
})

export const AddUser = t.strict({
  email: t.string,
  password: t.string,
  name: t.string
})

export const DeleteUser = t.strict({
  userid: t.number,
  password: t.string
})


// todo

export const GetTodos = t.strict({
  userid: t.number
})

export const ToggleTodoComplete = t.strict({
  todoid: t.number
})

export const AddTodo = t.strict({
  userid: t.number,
  text: t.string
})

export const DeleteTodo = t.strict({
  todoid: t.number
})
