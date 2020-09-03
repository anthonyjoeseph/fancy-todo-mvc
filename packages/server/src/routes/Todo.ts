import { Int } from 'io-ts'
import { Router } from 'express'
import { parsedResponseArrayEndpoint, emptyResponseEndpoint, parsedResponseSingleEndpoint } from '../util'
import db from '../db'
import { Todo } from '../../../shared/model'
import { GetTodos, ToggleTodoComplete, DeleteTodo, AddTodo } from '../../../shared/endpoints'

const router = Router()

router.post('/', parsedResponseArrayEndpoint(
  GetTodos.decode,
  ({ userid }) => db.any<unknown>('select * from todos where user_id = $1', [userid]),
  Todo.decode,
))

router.post('/toggle-complete', emptyResponseEndpoint(
  ToggleTodoComplete.decode,
  ({ todoid }) => db.none('UPDATE todos SET completed = NOT completed WHERE id = $1', [todoid]),
))

router.post('/add', parsedResponseSingleEndpoint(
  AddTodo.decode,
  ({ userid, text }) => db.one<unknown>('INSERT INTO todos (user_id, text) VALUES ($1, $2) returning id', [userid, text], event => event.id),
  Int.decode
))

router.post('/delete', emptyResponseEndpoint(
  DeleteTodo.decode,
  ({ todoid }) => db.none('DELETE FROM todos WHERE id = $1', [todoid]),
))

export default router
