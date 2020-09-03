import { makeADT, ofType, ADTType, unionADT } from '@morphic-ts/adt'
import * as t from 'io-ts'
import * as O from 'fp-ts/Option'
import * as E from 'fp-ts/Either'
import { Todo, User } from '../../../shared/model'
import { LoggedOutLocation, Location, LoggedInLocation, ExistingLocation } from './Location'
import React from 'react'

export const AppStateContext = React.createContext<[
  AppState,
  (_: AppState) => void,
  (_: ExistingLocation) => void
]>([
  E.left({
    location: LoggedOutLocation.of.NotFound({ value: {} }),
    redirect: O.none,
    userError: O.none
  }),
  (_: AppState) => {},
  (_: ExistingLocation) => {}
])

export type AppState = E.Either<LoggedOut, LoggedIn>

export interface LoggedOut {
  readonly location: LoggedOutLocation
  readonly userError: O.Option<UserError>
  readonly redirect: O.Option<LoggedInLocation>
}

export interface LoggedIn {
  readonly location: Location
  readonly user: User
  readonly todos: E.Either<APIError, Todo[]>
}


interface Network { readonly type: 'Network' }
interface Parse {
  readonly type: 'Parse'
  readonly errors: t.Errors
}
export const APIError = makeADT('type')({
  Network: ofType<Network>(),
  Parse: ofType<Parse>()
})
export type APIError = ADTType<typeof APIError>

interface NoUser { readonly type: 'NoUser' }
interface BadPassword { readonly type: 'BadPassword' }
export const UserError = unionADT([
  APIError,
  makeADT('type')({
    NoUser: ofType<NoUser>(),
    BadPassword: ofType<BadPassword>(),
  })
])
export type UserError = ADTType<typeof UserError>
