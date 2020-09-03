import { end, lit, int } from 'fp-ts-routing';
import { routingFromMatches5 } from 'morphic-ts-routing';
import { ADTType } from '@morphic-ts/adt';

export const {
  parse,
  format,
  adt: Location,
} = routingFromMatches5(
  ['Landing', end],
  ['Login', lit('login').then(end)],
  ['AllTodos', int('userid').then(end)],
  ['ActiveTodos', int('userid').then(lit('active')).then(end)],
  ['CompletedTodos', int('userid').then(lit('completed')).then(end)],
);
export type Location = ADTType<typeof Location>

export const LoggedOutLocation = Location.select(['NotFound', 'Landing', 'Login'])
export type LoggedOutLocation = ADTType<typeof LoggedOutLocation>

export const LoggedInLocation = Location.select(['AllTodos', 'ActiveTodos', 'CompletedTodos'])
export type LoggedInLocation = ADTType<typeof LoggedInLocation>

export const ExistingLocation = Location.exclude(['NotFound'])
export type ExistingLocation = ADTType<typeof ExistingLocation>

export const isLoggedOutLocation = (l: Location): l is LoggedOutLocation => LoggedOutLocation.verified(l as LoggedOutLocation) 
