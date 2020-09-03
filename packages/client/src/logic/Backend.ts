import { pipe } from 'fp-ts/pipeable'
import * as E from 'fp-ts/Either'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import * as t from 'io-ts'
import {
  GetTodos,
  AddTodo,
  ToggleTodoComplete,
  LoginUser,
  AddUser,
  getTodosEndpoint,
  addTodoEndpoint,
  toggleCompleteEndpoint,
  loginUserEndpoint,
  addUserEndpoint,
} from '../../../shared/endpoints'
import { Todo, User } from '../../../shared/model'
import { APIError } from './AppState'
import { flow } from 'fp-ts/lib/function'

const networkCall = <A>(
  uri: string,
  encoder: (a: A) => A,
  val: A,
) => TE.tryCatch(
  () => fetch(`${process.env.BACKEND_URI}${uri}`, {
    body: JSON.stringify(encoder(val))
  }),
  () => APIError.of.Network({}),
)

const networkCallNoResp = flow(
  networkCall,
  TE.map(() => undefined),
)

const responseError = T.map(E.chain((r: Response) => r.ok
  ? E.right(r)
  : E.left(APIError.of.Network({}))
))

const parseResponse = <A>(
  decoder: (u: unknown) => E.Either<t.Errors, A>
) => flow(
  responseError,
  TE.chain(r => TE.tryCatch(
    () => r.json(),
    () => APIError.of.Parse({ errors: [] }),
  )),
  T.map(flow(
    decoder,
    E.mapLeft(errors => APIError.of.Parse({ errors }))
  )),
)

export const getTodos = (userid: number) => pipe(
  networkCall(getTodosEndpoint, GetTodos.encode, { userid }),
  parseResponse(t.array(Todo).decode),
)

export const addTodo = (
  userid: number,
  text: string
) => pipe(
  networkCall(addTodoEndpoint, AddTodo.encode, { userid, text }),
  parseResponse(t.Int.decode),
  TE.map((id): Todo => ({
    id,
    text,
    completed: false,
  }))
)

export const toggleTodo = (
  todoid: number
) => networkCallNoResp(toggleCompleteEndpoint, ToggleTodoComplete.encode, { todoid })

export const loginUser = (
  email: string,
  password: string,
) => pipe(
  networkCall(loginUserEndpoint, LoginUser.encode, { email, password }),
  parseResponse<User>(User.decode),
)

export const addUser = (
  email: string,
  password: string,
  name: string,
) => pipe(
  networkCall(addUserEndpoint, AddUser.encode, { email, password, name }),
  parseResponse(t.Int.decode),
  TE.map((id): User => ({
    email,
    id,
    name,
  }))
)
