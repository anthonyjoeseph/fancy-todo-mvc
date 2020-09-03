import * as T from 'fp-ts/Task'
import type { Express } from 'express'
import supertest, { Response } from 'supertest'

export const supertestTask = (
  app: Express,
  uri: string,
  body: object
): T.Task<Response> => () => supertest(app)
  .post(uri)
  .send(body)