import { pipe } from 'fp-ts/pipeable'
import * as T from 'fp-ts/Task'
import { Do } from 'fp-ts-contrib/lib/Do'
import supertest from 'supertest';
import { Status } from 'hyper-ts';
import app from '../src/App'
import { supertestTask } from './util';

const users = () => describe('User Routes', () => {
  it('logs user in', () => supertest(app)
    .post("/api/user/")
    .send({ email: "typesafefrontend@gmail.com", password: "admin" })
    .then(response => expect(response.body)
      .toStrictEqual({
        id: 1,
        email: "typesafefrontend@gmail.com",
        name: "A.G."
      }))
  )
  it('adds & deletes user', () => pipe(
    Do(T.task)
      .bind('newUserResponse', supertestTask(
        app, "/api/user/add", { email: "new@gmail.com", password: "newpassword", name: "New User" }
      ))
      .bind('addedResponse', supertestTask(
        app, "/api/user/", { email: "new@gmail.com", password: "newpassword" }
      ))
      .bindL('deleteResponse', ({
        newUserResponse: { body: newUserID }
      }) => supertestTask(
        app, "/api/user/delete", { userid: newUserID, password: "newpassword" }
      ))
      .return(({
        addedResponse: { body: addedBody },
        deleteResponse,
      }) => expect(
        'name' in addedBody && addedBody.name === 'New User'
        && deleteResponse.status === Status.OK
      ).toBeTruthy()),
    invokeTask => invokeTask()
  ))
  it('fails on bad route', () => supertest(app)
    .get("/api/user/nonexistent")
    .then(response => expect(response.status)
      .toBe(Status.NotFound)
    )
  )
})

export default users
