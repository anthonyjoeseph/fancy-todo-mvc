import * as t from 'io-ts'

export const User = t.strict({
  id: t.number,
  email: t.string,
  name: t.string
})
export type User = t.TypeOf<typeof User>

export const Todo = t.strict({
  id: t.number,
  text: t.string,
  completed: t.boolean
})
export type Todo = t.TypeOf<typeof Todo>