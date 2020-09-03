import { pipe } from 'fp-ts/pipeable'
import { flow } from 'fp-ts/function'
import * as E from 'fp-ts/Either'
import * as A from 'fp-ts/Array'
import * as H from 'hyper-ts'
import * as t from 'io-ts'
import { toRequestHandler } from 'hyper-ts/lib/express'
import * as TE from 'fp-ts/TaskEither'
import { makeADT, ADTType, ofType } from '@morphic-ts/adt'
import { failure } from 'io-ts/lib/PathReporter'

interface APIRequestBody {
  readonly tag: 'APIRequestBody'
  readonly errors: t.Errors
}

interface DatabaseRequest {
  readonly tag: 'DatabaseRequest'
  readonly error: Error
}

interface DatabaseResponse {
  readonly tag: 'DatabaseResponse'
  readonly errors: t.Errors
}
interface JSONFormatError {
  readonly tag: 'JSONFormatError'
}

const APIResponseError = makeADT('tag')({
  APIRequestBody: ofType<APIRequestBody>(),
  DatabaseRequest: ofType<DatabaseRequest>(),
  DatabaseResponse: ofType<DatabaseResponse>(),
  JSONFormatError: ofType<JSONFormatError>()
})
type APIResponseError = ADTType<typeof APIResponseError>

const iotsErrorsToString = flow(
  failure,
  a => a.join(' ')
)

export const parsedResponseArrayEndpoint = <B, R>(
  decodeReqBody: (i: unknown) => t.Validation<B>,
  dbRequest: (reqBody: B) => Promise<unknown[]>,
  decodeDBResp: (i: unknown) => t.Validation<R>
) => pipe(
  H.decodeBody(decodeReqBody),
  H.mapLeft(errors => APIResponseError.of.APIRequestBody({ errors })),
  H.ichain((reqBody) => pipe(
    TE.tryCatch(
      () => dbRequest(reqBody),
      E.toError
    ),
    TE.mapLeft(error => APIResponseError.of.DatabaseRequest({ error })),
    TE.chain(flow(
      A.map(decodeDBResp),
      A.sequence(E.either),
      E.mapLeft(errors => APIResponseError.of.DatabaseResponse({ errors })),
      TE.fromEither,
    )),
    H.fromTaskEither
  )),
  H.ichain((parsedResp) => pipe(
    H.status<APIResponseError>(H.Status.OK),
    H.ichain(() => H.json(parsedResp, () => APIResponseError.of.JSONFormatError({})))
  )),
  H.orElse((error) => pipe(
    H.status(H.Status.BadRequest),
    H.ichain(() => H.closeHeaders()),
    H.ichain(() => pipe(
      error,
      APIResponseError.matchStrict<string>({
        APIRequestBody: ({ errors }) => `Request body parse error:\n${iotsErrorsToString(errors)}`,
        DatabaseRequest: ({ error: { message } }) => `Database request error:\n${message}`,
        DatabaseResponse: ({ errors }) => `Database response parse error:\n${iotsErrorsToString(errors)}`,
        JSONFormatError: () => 'JSON formatting error',
      }),
      H.send
    ))
  )),
  toRequestHandler
)

export const parsedResponseSingleEndpoint = <B, R>(
  decodeReqBody: (i: unknown) => t.Validation<B>,
  dbRequest: (reqBody: B) => Promise<unknown>,
  decodeDBResp: (i: unknown) => t.Validation<R>
) => pipe(
  H.decodeBody(decodeReqBody),
  H.mapLeft(errors => APIResponseError.of.APIRequestBody({ errors })),
  H.ichain((reqBody) => pipe(
    TE.tryCatch(
      () => dbRequest(reqBody),
      E.toError
    ),
    TE.mapLeft(error => APIResponseError.of.DatabaseRequest({ error })),
    TE.chain(flow(
      decodeDBResp,
      E.mapLeft(errors => APIResponseError.of.DatabaseResponse({ errors })),
      TE.fromEither,
    )),
    H.fromTaskEither
  )),
  H.ichain((parsedResp) => pipe(
    H.status<APIResponseError>(H.Status.OK),
    H.ichain(() => H.json(parsedResp, () => APIResponseError.of.JSONFormatError({})))
  )),
  H.orElse((error) => pipe(
    H.status(H.Status.BadRequest),
    H.ichain(() => H.closeHeaders()),
    H.ichain(() => pipe(
      error,
      APIResponseError.matchStrict<string>({
        APIRequestBody: ({ errors }) => `Request body parse error:\n${iotsErrorsToString(errors)}`,
        DatabaseRequest: ({ error: { message } }) => `Database request error:\n${message}`,
        DatabaseResponse: ({ errors }) => `Database response parse error:\n${iotsErrorsToString(errors)}`,
        JSONFormatError: () => 'JSON formatting error',
      }),
      H.send
    ))
  )),
  toRequestHandler
)

const InsertError = APIResponseError.exclude(['DatabaseResponse'])
type InsertError = ADTType<typeof InsertError>

export const emptyResponseEndpoint = <B>(
  decodeReqBody: (i: unknown) => t.Validation<B>,
  dbRequest: (reqBody: B) => Promise<unknown>
) => pipe(
  H.decodeBody(decodeReqBody),
  H.mapLeft(errors => InsertError.of.APIRequestBody({ errors })),
  H.ichain((reqBody) => pipe(
    TE.tryCatch(
      () => dbRequest(reqBody),
      E.toError
    ),
    TE.mapLeft(error => InsertError.of.DatabaseRequest({ error })),
    H.fromTaskEither
  )),
  H.ichain(() => pipe(
    H.status<InsertError>(H.Status.OK),
    H.ichain(() => H.closeHeaders()),
    H.ichain(() => H.send(''))
  )),
  H.orElse((error) => pipe(
    H.status(H.Status.BadRequest),
    H.ichain(() => H.closeHeaders()),
    H.ichain(() => pipe(
      error,
      InsertError.matchStrict<string>({
        APIRequestBody: ({ errors }) => `Request body parse error:\n${iotsErrorsToString(errors)}`,
        DatabaseRequest: ({ error: { message } }) => `Database request error:\n${message}`,
        JSONFormatError: () => 'JSON formatting error',
      }),
      H.send
    ))
  )),
  toRequestHandler
)