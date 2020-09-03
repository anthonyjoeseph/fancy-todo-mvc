import { pgp } from '../src/db'
import users from './User'
import todos from './Todo'

describe("All tests", () => {
  users()
  todos()
  afterAll(() => {
    pgp.end()
  })
});