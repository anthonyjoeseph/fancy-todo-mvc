import { Int } from 'io-ts'
import { Router } from 'express'
import { emptyResponseEndpoint, parsedResponseSingleEndpoint } from '../util'
import db from '../db'
import { User } from '../../../shared/model'
import { LoginUser, AddUser, DeleteUser } from '../../../shared/endpoints'

const router = Router()

router.post('/', parsedResponseSingleEndpoint(
  LoginUser.decode,
  ({ email, password }) => db.one('select id, name, email from users where email = $1 and password = $2', [email, password]),
  User.decode
));

router.post('/add', parsedResponseSingleEndpoint(
  AddUser.decode,
  ({ email, password, name }) => db.one('INSERT INTO users (email, password, name) VALUES ($1, $2, $3) returning id', [email, password, name], event => event.id),
  Int.decode
));

router.post('/delete', emptyResponseEndpoint(
  DeleteUser.decode,
  ({ userid, password }) => db.none('DELETE FROM users WHERE id = $1 AND password = $2', [userid, password]),
));

export default router;
