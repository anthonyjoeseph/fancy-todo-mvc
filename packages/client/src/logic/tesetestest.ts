import axios, { AxiosResponse } from 'axios'
import * as A from 'fp-ts/lib/Array'
import * as TE from 'fp-ts/lib/TaskEither'
import * as E from 'fp-ts/lib/Either'
import * as O from 'fp-ts/Option'
import * as T from 'fp-ts/lib/Task'
import { sequenceT } from 'fp-ts/lib/Apply'
import { pipe } from 'fp-ts/lib/pipeable'
import { flow } from 'fp-ts/lib/function'
import { failure } from 'io-ts/lib/PathReporter'
import * as t from 'io-ts'
import { makeADT, ofType, ADTType, ADT } from '@morphic-ts/adt'

interface NoEndpoint {
  type: 'NoEndpoint'
  endpoint: string
}
interface BadRequestBody {
  type: 'BadRequestBody'
  malformedBody: string
}
interface DatabaseError {
  type: 'DatabaseError'
  sqlErrorMessage: string
}
interface ParseError {
  type: 'ParseError'
  errors: t.Errors,
}

const enum ErrorType {
  Network,
  Parse
}

const j: ErrorType = 2

const AppError: ADT<NoEndpoint | BadRequestBody | DatabaseError | ParseError, "type"> = makeADT('type')({
  NoEndpoint: ofType<NoEndpoint>(),
  BadRequestBody: ofType<BadRequestBody>(),
  DatabaseError: ofType<DatabaseError>(),
  ParseError: ofType<ParseError>(),
})
type AppError = ADTType<typeof AppError>

const NetworkError = AppError.select(['NoEndpoint', 'BadRequestBody', 'DatabaseError'])
type NetworkError = ADTType<typeof NetworkError>

const isNetworkError = (error: AppError): error is NetworkError =>
  NetworkError.verified(error as NetworkError)

const error: AppError = 3
const a: string = pipe(
  error as NetworkError,
  O.fromPredicate(NetworkError.verified),
  O.map((networkError: NetworkError) => {
    ...
  })
)

// type widening as well
// handles multiple different return types
const result: string | number = AppError.match(
  {
    NoEndpoint: ({ endpoint }) => `bad endpoint: ${endpoint}`,
    BadRequestBody: () => 3,
  },
  () => 'other'
)(error)

//create a schema to load our user data into
const users = t.type({
  data: t.array(t.type({
    first_name: t.string
  }))
});
type Users = t.TypeOf<typeof users>

//schema to hold the deepest of answers
const answer = t.type({
  ans: t.number
});

//Convert our api call to a TaskEither
const httpGet = (url: string) => TE.tryCatch<Error, AxiosResponse>(
  () => axios.get(url),
  E.toError,
)

//function to decode an unknown into an A
const decodeWith = <A>(decoder: t.Decoder<unknown, A>) =>
  flow(
    decoder.decode,
    E.mapLeft((errors) => AppError.of.ParseError({ errors, errorID: 1000 })),
    TE.fromEither
  )

//takes a url and a decoder and gives you back an Either<Error, A>
const getFromUrl = <A>(url:string, codec:t.Decoder<unknown, A>) => pipe(
  httpGet(url),
  TE.map(x => x.data),
  TE.mapLeft(({ message }) => AppError.of.NetworkError({ message, metaData: { errorID: 2000 } })),
  TE.chain(decodeWith(codec))
);

const getAnswer = pipe(
  TE.right({ ans: 42 }),
  TE.chain(decodeWith(answer))
)

const apiUrl = (page:number) => `https://reqres.in/api/users?page=${page}`

const smashUsersTogether = (users1:Users, users2:Users) =>
  pipe(A.flatten([users1.data, users2.data]), A.map(item => item.first_name))

const handleErrors = AppError.matchStrict({
  NetworkError: ({ message }) => T.of(`Network error: ${message}`),
  ParseError: ({ errors }) => pipe(
    errors,
    failure,
    A.takeLeft(3),
    a => a.join('\n'),
    T.of
  ),
})

const showWifiNotification = T.of('connect to wifi')
const logParseErrors = (e: t.Errors) => T.of(`logging errors: ${failure(e).join('\n')}`)
// const showWifiNotification: T.Task<void> = T.of(undefined)
// const logParseErrors = (e: t.Errors): T.Task<void> => T.of(console.error(`logging errors: ${failure(e).join('\n')}`))


const errorIDLens = AppError.matchLens({
  NetworkError: M.Lens.fromPath<NetworkError>()(['metaData', 'errorID']),
  ParseError: M.Lens.fromProp<ParseError>()('errorID'),
})

const error: AppError = '';
const errorID: number = errorIDLens.get(error)

const runProgram = pipe(
  sequenceT(TE.taskEither)(
    getAnswer, 
    getFromUrl(apiUrl(1), users), 
    getFromUrl(apiUrl(2), users)
  ),
  TE.fold(
    handleErrors,
    ([ans, users1, users2]) => T.of(
      smashUsersTogether(users1, users2).join(", ") 
      + `\nThe answer was ${ans.ans} for all of you`),
  ),
)();

const runProgram2 = Promise.all([
  Promise.resolve({ ans: 42 }),
  fetch('https://reqres.in/api/users?page=1').then(a => a.json()),
  fetch('https://reqres.in/api/users?page=2').then(a => a.json()),
]).then(([ans, users1, users2]) =>
  [...users1.data, ...users2.dat]
    .map(item => item.firstName)
    .join(', ')
  + `\nThe answer was ${ans.ans} for all of you`
).catch(error => {
  if (error.message.startsWith('Cannot read property')) {
    console.error('Parse error')
  } else {
    console.error('Network error')
  }
})
  

/**
  AppError.matchStrict({
    AnswerError: () => 
    ParseError: ({ errors }) =>
      T.of(`json parse failure here:\n${failure(errors).join('\n')}`),
    PasswordError: () => signupNewUser,
    UsernameError: () => resetPassword,
  })
*/

// runProgram.then(console.log)

