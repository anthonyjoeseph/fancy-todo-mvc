import { Int } from 'io-ts'
import { Router } from 'express'
import { parsedResponseArrayEndpoint, emptyResponseEndpoint, parsedResponseSingleEndpoint } from '../util'
import db from '../db'
import { Todo } from '../../../shared/src/model'
import {
  GetTodos,
  ToggleTodoComplete,
  DeleteTodo,
  AddTodo,
  getTodosEndpoint,
  toggleCompleteEndpoint,
  addTodoEndpoint,
  deleteTodoEndpoint
} from '../../../shared/src/endpoints'

const router = Router()

router.post(getTodosEndpoint, parsedResponseArrayEndpoint(
  GetTodos.decode,
  ({ userid }) => db.any<unknown>('select * from todos where user_id = $1', [userid]),
  Todo.decode,
))

router.post(toggleCompleteEndpoint, emptyResponseEndpoint(
  ToggleTodoComplete.decode,
  ({ todoid }) => db.none('UPDATE todos SET completed = NOT completed WHERE id = $1', [todoid]),
))

router.post(addTodoEndpoint, parsedResponseSingleEndpoint(
  AddTodo.decode,
  ({ userid, text }) => db.one<unknown>('INSERT INTO todos (user_id, text) VALUES ($1, $2) returning id', [userid, text], event => event.id),
  Int.decode
))

router.post(deleteTodoEndpoint, emptyResponseEndpoint(
  DeleteTodo.decode,
  ({ todoid }) => db.none('DELETE FROM todos WHERE id = $1', [todoid]),
))

export default router
