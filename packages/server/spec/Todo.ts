import { pipe } from 'fp-ts/pipeable'
import * as T from 'fp-ts/Task'
import { Do } from 'fp-ts-contrib/lib/Do'
import supertest from 'supertest';
import { Status } from 'hyper-ts';
import app from '../src/App'
import { supertestTask } from './util';

const todos = () => describe('Todo Routes', () => {
  it('gets todos for a user', () => supertest(app)
    .post("/api/todo/")
    .send({ userid: 1 })
    .then(response =>
      expect(response.body.some(todo => todo.text === "Exercise"))
        .toBeTruthy()
    )
  )
  it('toggles complete both true and false', () => pipe(
    Do(T.task)
      .do(supertestTask(
        app, "/api/todo/toggle-complete", { todoid: 1 }
      ))
      .bind('toggledResp', supertestTask(
        app, "/api/todo/", { userid: 1 }
      ))
      .do(supertestTask(
        app, "/api/todo/toggle-complete", { todoid: 1 }
      ))
      .bind('untoggledResp', supertestTask(
        app, "/api/todo/", { userid: 1 }
      ))
      .return(({
        toggledResp: { body: toggledBody },
        untoggledResp: { body: untoggledBody }
      }) => expect(
        toggledBody.some(todo => todo.id === 1 && todo.completed)
        && untoggledBody.some(todo => todo.id === 1 && !todo.completed)
      ).toBeTruthy()),
    invokeTask => invokeTask(),
  ))
  it('adds & deletes todo for user', () => pipe(
    Do(T.task)
      .bind('insertedResponse', supertestTask(
        app, "/api/todo/add", { userid: 1, text: "New Todo" },
      ))
      .bind('addedResponse', supertestTask(
        app, "/api/todo/", { userid: 1 }
      ))
      .doL(({
        insertedResponse: { body: insertedID }
      }) => supertestTask(
        app, "/api/todo/delete", { todoid: insertedID }
      ))
      .bind('deletedResponse', supertestTask(
        app, "/api/todo/", { userid: 1 }
      ))
      .return(({
        addedResponse: { body: addedBody },
        deletedResponse: { body: deletedBody },
      }) => expect(
        addedBody.some(todo => todo.text === "New Todo")
        && !deletedBody.some(todo => todo.text === "New Todo")
      ).toBeTruthy()),
    invokeTask => invokeTask(),
  ))
  it('fails on bad route', () => supertest(app)
    .get("/api/todo/nonexistent")
    .then(response => expect(response.status)
      .toBe(Status.NotFound)
    )
  )
})

export default todos