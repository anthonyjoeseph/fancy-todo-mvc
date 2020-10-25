![Multiple cases of bonzai](https://cdn1.bigcommerce.com/server4100/6ys4nr/product_images/uploaded_images/beginner-bonsai-trees.jpg?t=1535695373)

# Contents

- [The Prompt](#the-prompt)
- [Union types to the rescue!](#union-types-to-the-rescue-)
    + [Benefits](#benefits)
- [Unions of Complex Types - Sum Types](#unions-of-complex-types---sum-types)
- [Even more features with `@morphic-ts/adt`](#even-more-features-with---morphic-ts-adt---3-)
  * [Other advantages of `@morphic-ts/adt`](#other-advantages-of---morphic-ts-adt-)
- [Is it Actually Boilerplate](#is-it-actually-boilerplate)
- [How far we've come](#how-far-we-ve-come)
- [Conclusion](#conclusion)


# The Prompt

Let's build on the application outlined in [fp-ts and Beautiful API Calls](https://dev.to/gnomff_65/fp-ts-and-beautiful-api-calls-1f55) (a lovely application to be sure).

We want to be able to customize error messages based on their source:

```ts
const handleErrors = (errors: Error): T.Task<string> => {
  const message: string = ...
  if (/* error is from parsing */) {
    return T.of(`Parse error: ${message}`)
  } else if (/* error is from networking */) {
    return T.of(`Network error: ${message}`)
  }
}
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
        + `\nThe answer was ${ans.ans} for all of you`
    ),
  )
)();
```

As it stands, implementing `handleErrors` is difficult, since its input is of type `Error`. This means that we'll have to parse the `string` at `error.message`, which seems like a brittle solution. What if we forget to handle a case or misspell something?

# Union types to the rescue!

```ts
const enum ErrorType {
  Network,
  Parse,
}
interface AppError {
  type: ErrorType
  message: string
}
```

Here, `ErrorType` is a union type. A union type encodes an 'or' relationship, meaning that an `ErrorType` is either `Network` _or_ `Parse`, but never both. Right now we're using a simple typescript [enumerator](https://www.typescriptlang.org/docs/handbook/enums.html) to implement our union type, but there are other ways of doing it[^1].

We'll need to rewrite our networking code to conform to our new `AppError` interface:

```ts
const decodeWith = <A>(decoder: t.Decoder<unknown, A>) =>
  flow(
    decoder.decode,
    E.mapLeft((errors): AppError => ({
      type: ErrorType.Parse,
      message: failure(errors).join('\n')
    })),
    TE.fromEither
  )

const getFromUrl = <A>(url:string, codec:t.Decoder<unknown, A>) => pipe(
  httpGet(url),
  TE.map(x => x.data),
  TE.mapLeft(({ message }): AppError => ({ type: ErrorType.Network, message })),
  TE.chain(decodeWith(codec))
);
```

Now implementing `handleErrors` is a breeze!

```ts
const handleErrors = (appError: AppError): T.Task<string> => {
  switch(appError.type) {
    case ErrorType.Network:
      return T.of(`Network error: ${appError.message}`)
    case ErrorType.Parse:
      return T.of(`Parse error: ${appError.message}`)
  }
}
```

### Benefits

We get autocompletion when we type in `ErrorType.` - our IDE recommends `ErrorType.Network` and `ErrorType.Parse` to us.

Furthermore, we get an exhaustiveness check from the switch statement, so this won't compile:

```ts
const handleErrors = (appError: AppError): T.Task<string> => {
  switch(appError.type) {
    case ErrorType.Network:
      return T.of(`Network error: ${appError.message}`)
  }
}
// Function lacks ending return statement and return type does not include 'undefined'.
```

Like anything that adds type-safety, `ErrorType` helps you make a visible contract for yourself up front and hold yourself to it later on.

# Unions of Complex Types - Sum Types

What if we want to display the first three lines of our `ErrorType.Parse` errors to the user, and log the full error for the developer?

We need an `AppError` type that can handle both situations. 

```ts
interface AppError {
  type: ErrorType
  message: string
  firstThreeLines: string | undefined
}
```

This isn't a great solution. We have duplicate data all over the place. `firstThreeLines` is just the first three lines of `message`, and a value of `undefined` for `firstThreeLines` is the same as a value of `ErrorType.Network` for `type`. There is no [SSOT](https://en.wikipedia.org/wiki/Single_source_of_truth).

It would be simplest if we could keep track of the original `t.Errors` value returned by `io-ts`

```ts
interface AppError {
  type: ErrorType
  message: string | t.Errors
}
```

This works, but we'll have to do an ugly `typeof` check to determine what `message` is. And once again we have duplicate data: if our `message` is a `string`, our `type` should never be `ErrorType.Parse`. Our metadata is duplicated. We can do bad stuff like this:

```ts
const absurdError: AppError = {
  type: ErrorType.Parse,
  message: 'not an io-ts error' // we can have a 'string' here!
}
```

Is there a way to prevent these potential mistakes at compile time?

Let's ditch `ErrorType` and try something radical.

```ts
interface NetworkError  {
  type: 'NetworkError'
  message: string
}
interface ParseError {
  type: 'ParseError'
  errors: t.Errors
}
type AppError = NetworkError | ParseError
```

How does this make our code look?

```ts
const handleErrors = (appError: AppError): T.Task<string> => {
  switch(appError.type) {
    case 'NetworkError':
      return T.of(`Network error: ${appError.message}`)
    case 'ParseError':
      return pipe(
        appError.errors,
        failure,
        A.takeLeft(3),
        a => a.join('\n'),
        T.of
      )
  }
}
```

Like magic, Typescript can infer which data our `appError` contains depending on which case is being handled. Calling `appError.errors` outside the scope of `case 'ParseError':` would be an error, but inside the scope it typechecks.

This is called a [tagged union](https://mariusschulz.com/articles/tagged-union-types-in-typescript) type, or a sum type[^2]. Here, our tag is `type`.

And we have the flexibility to handle `ParseError`s differently in different cases:

```ts
const logAllParseErrors = (appError: AppError): void => {
  if (appError.type === 'ParseError') {
    console.error(failure(appError.errors).join('\n'))
  }
}
```

The underlying upgrade here is that `AppError` is now able to contain completely different data depending on which case it represents.

# Even more features with `@morphic-ts/adt`[^3]

If we don't like the `switch` statement's statement-oriented appearance, we can get a more [expression-oriented](https://alvinalexander.com/scala/fp-book/note-about-expression-oriented-programming/) appearance using `matchStrict` from `@morphic-ts/adt`

```ts
import { makeADT, ofType, ADT, ADTType } from '@morphic-ts/adt'

// little bit of boilerplate here
const AppError: ADT<NetworkError | ParseError, "type"> = makeADT('type')({
  NetworkError: ofType<NetworkError>(),
  ParseError: ofType<ParseError>(),
})
type AppError = ADTType<typeof AppError>

const handleErrors: (a: AppError) => T.Task<string> = AppError.matchStrict({
  NetworkError: ({ message }) => T.of(`Network error: ${message}`),
  ParseError: ({ errors }) => pipe(
    errors,
    failure,
    A.takeLeft(3),
    a => a.join('\n'),
    T.of
  ),
})
```

`makeADT`'s first parameter is our tagged union's 'tag'. For this example, our tag is 'type'.

You might also notice that we have two entities called `AppError`: a `const` and a `type`. The `const` is `morphic`'s magical `ADT` type that gives us fancy type-safe operations like `matchStrict`. The compiler is able to infer from context which of the two `AppError` entities to use, and you only have to export & import `AppError` once to be able to use both entities.

We also get a nice constructor syntax:

```ts
const decodeWith = <A>(decoder: t.Decoder<unknown, A>) =>
  flow(
    decoder.decode,
    E.mapLeft((errors) => AppError.of.ParseError({ errors, })),
    TE.fromEither
  )
const getFromUrl = <A>(url:string, codec:t.Decoder<unknown, A>) => pipe(
  httpGet(url),
  TE.map(x => x.data),
  TE.mapLeft(({ message }) => AppError.of.NetworkError({ message })),
  TE.chain(decodeWith(codec))
);
```

In my experience, the curried pattern match provided by `matchStrict` makes the `@morphic-ts/adt` boilerplate worth it for most sum types.

## Other advantages of `@morphic-ts/adt`

We get many features for free:

- [type predicates](https://www.typescriptlang.org/docs/handbook/advanced-types.html#using-type-predicates)

```ts
const error: AppError = ...
let message: string = 'default'
if (AppError.is.NetworkError(error)) {
  message = error.message
}
// or
import * as O from 'fp-ts/Option'

const message = pipe(
  error,
  O.fromPredicate(AppError.is.NetworkError),
  O.map(e => e.message),
  O.getOrElse(() => 'default'),
)
```

- [lenses](https://github.com/gcanti/monocle-ts)

```ts
// add data to the cases
interface NetworkError {
  type: 'NetworkError'
  message: string
  metaData: {
    errorID: number
  }
}
interface ParseError {
  type: 'ParseError'
  errors: t.Errors
  errorID: number
}

// ...

import * as M from 'monocle-ts'

const errorIDLens: (a: AppError) => number = AppError.matchLens({
  NetworkError: M.Lens.fromPath<NetworkError>()(['metaData', 'errorID']),
  ParseError: M.Lens.fromProp<ParseError>()('errorID'),
})

const error: AppError = ...
const errorID: number = errorIDLens.get(error)
```

- `unionADT`

```ts
interface NoEndpoint ...
interface BadRequestBody ...
interface DatabaseError ...
interface ParseError ...

const NetworkError = makeADT('type')({
  NoEndpoint: ofType<NoEndpoint>(),
  BadRequestBody: ofType<BadRequestBody>(),
  DatabaseError: ofType<DatabaseError>(),
})
type NetworkError = ADTType<typeof NetworkError>

const AppError = unionADT([
  NetworkError,
  makeADT('type')({
    ParseError: ofType<ParseError>(),
  }),
])
type AppError = ADTType<typeof AppError>
```

- `exclude`

```ts
const AppError = makeADT('type')({
  NoEndpoint: ofType<NoEndpoint>(),
  BadRequestBody: ofType<BadRequestBody>(),
  DatabaseError: ofType<DatabaseError>(),
  ParseError: ofType<ParseError>(),
})
type AppError = ADTType<typeof AppError>

const NetworkError = AppError.exclude(['ParseError'])
type NetworkError = ADTType<typeof NetworkError>
```

- `select`

```ts
const NetworkError = AppError.select(['NoEndpoint', 'BadRequestBody', 'DatabaseError'])
```

- default match case

```ts
// type widening as well
// handles multiple different return types
const matcher: (a: AppError) => string | number = AppError.match(
  {
    NoEndpoint: ({ endpoint }) => `bad endpoint: ${endpoint}`,
    BadRequestBody: () => 3,
  },
  () => 'other'
)
const error: AppError = ...
const result: string | number = matcher(error)
```

- Verification (narrowing to a subset)

```ts
const error: AppError = ...
const a: string = pipe(
  error as NetworkError,
  O.fromPredicate(NetworkError.verified),
  O.map((networkError: NetworkError) => {
    ...
  })
)
```

The added boilerplate is unfortunate but minimal, and the generated ADT type is powerful. More powerful even than sum type manipulation in Haskell: The [equivalent](http://hackage.haskell.org/package/total-1.0.5/docs/Lens-Family-Total.html) of `matchLens` requires a Haskell [language extension](https://wiki.haskell.org/A_practical_Template_Haskell_Tutorial).

Additionally, morphic can solve many of the problems outlined in [Matt Parsons](https://github.com/parsonsmatt)'s wonderful [The Trouble with Typed Errors](https://www.parsonsmatt.org/2018/11/03/trouble_with_typed_errors.html).

To oversimplify, Parsons makes the correct point that monolithic error types are bad. With morphic, you can:

- keep your types small with `select` or `unionADT`
- pass errors upstream with `validate` 

# Is it Actually Boilerplate

Functions like `httpGet` and `decodeWith` can seem like boilerplate. Shouldn't every application have to write something like this? Surely there must be existing npm packages out there that do this type of thing for you.

There are several out there (like [fetch-ts](https://github.com/YBogomolov/fetcher-ts), [fp-fetch](https://www.npmjs.com/package/fp-fetch), & [react-fetchable](https://github.com/remojansen/react-fetchable)). My current favorite is [appy](https://github.com/contactlab/appy) because it accurately models javascript's `fetch` and composes nicely with `io-ts`. However, though I normally discourage re-inventing the wheel, I often prefer to write this kind of code on my own.

Most of the work in converting `Promise` into `TaskEither` is in deciding how granular your `Error` type needs to be. This is necessarily tied to each individual project's requirements. Some projects might be simple enough to display an "Error, please try again" message for everything, while some might need to log each error's http status code. It's also worth mentioning that `axios` has [different mocking capabilities](https://www.robinwieruch.de/axios-jest) than [`fetch`](http://www.wheresrhys.co.uk/fetch-mock/) and might not always be appropriate for every project.

# How far we've come

Here's a naive implementation of the original program, without type safety (it's a one liner):

```ts
const runProgram2 = Promise.all([
  Promise.resolve({ ans: 42 }),
  fetch('https://reqres.in/api/users?page=1').then(a => a.json()),
  fetch('https://reqres.in/api/users?page=2').then(a => a.json()),
]).then(([ans, users1, users2]) =>
  [...users1.data, ...users2.dat]
    .map(item => item.firstName)
    .join(', ')
  + `\nThe answer was ${ans.ans} for all of you`
).catch(error => error.message
  .startsWith('Cannot read property')
    ? console.error('Parse error')
    : console.error('Network error')
})
```

I must admit, the naive solution is attractive in its simplicity. We didn't even have to import anything. We could have saved some time writing the code like this instead.

What's better about our earlier type-safe solution?

- Due to the use of the `any` type, there are typos in the above code that the compiler wouldn't catch
- We aren't relying on the nuances of runtime error messages
- We're able to output specific parsing errors
- we can differentiate errors at compile time with exactly the granularity we want
- our function signatures tells us which specific errors must be handled
- we get compile time errors if we fail to handle every case
- autocompletion every step of the way

# Conclusion

Sum types are worth learning about! They have many applications on the frontend alone:
- routing (check out [my article!](https://dev.to/anthonyjoeseph/type-safe-routing-with-fp-ts-routing-2fli))
- [loading indicators](https://github.com/devexperts/remote-data-ts)
- [radio buttons](https://stackoverflow.com/questions/39372804/how-to-loop-through-enum-values-for-display-in-radio-buttons)
- representing a [day of the week](https://angular.io/api/common/WeekDay)
- representing [logged in vs anonymous users](https://guide.elm-lang.org/types/custom_types.html)
- [redux actions](https://mariusschulz.com/articles/tagged-union-types-in-typescript#modeling-redux-actions-with-tagged-union-types) (morphic even provides [`createReducer`](https://github.com/sledorze/morphic-ts/blob/1fda6ce378dcd763cb990b9dd64a51ca58e6c1da/packages/morphic-adt/test/adt.spec.ts#L166))
- etc.

And many types you may already know - [`boolean`](https://www.typescriptlang.org/docs/handbook/basic-types.html#boolean)[^4], [`Option`](https://dev.to/ryanleecode/practical-guide-to-fp-ts-option-map-flatten-chain-6d5), [`Either`](https://dev.to/gcanti/getting-started-with-fp-ts-either-vs-validation-5eja), [`These`](https://github.com/gcanti/fp-ts/blob/master/test/These.ts) - are sum types. The concept of a sum type (or tagged union) is a fundamental concept in data modeling (and [math](https://en.wikipedia.org/wiki/Coproduct)).

So even if you decide your application's error handling is simple enough that you don't want the added complexity, in the future you'll know how to model 'or' relationships between complex data at the type level.

If you're interested in learning more, here's a comprehensive [article](https://medium.com/fullstack-academy/better-js-cases-with-sum-types-92876e48fd9f) by [Gabriel Lebec](https://github.com/glebec) (warning: paywall).

[^1]: Under the hood, Typescript `enum` actually [maps each case to a `number`](https://blog.logrocket.com/why-typescript-enums-suck/), so this is valid:

  `const error: ErrorType = 3`

  Be careful of this! This can lead to unexpected behavior.

  They are actually [quite flexible](https://www.typescriptlang.org/docs/handbook/enums.html#computed-and-constant-members) in this regard, which makes them less [referentially transparent](https://en.wikipedia.org/wiki/Referential_transparency).

  In practice, sometimes I prefer to use a [union type of string literals](https://www.typescriptlang.org/docs/handbook/literal-types.html#string-literal-types) to increase referential transparency, although this can be a little less legible.

[^2]: The name 'sum type' refers to the number of possibilities it can represent. They exist in contrast to product types (e.g. Typescript interfaces, tuples) (they are mathematical [duals](https://en.wikipedia.org/wiki/Duality_(mathematics))). Take the following example:

  `enum Vehicle { Car, Motorcycle, Truck }`
  `enum Color { Yellow, Red, Blue }`
  `type BirthdayPartyTheme = Vehicle | Color`
  `interface Ride { wheels: Vehicle; style: Color }`
  
  What if we wanted to find out how many different possible `BirthdayPartyTheme`s there are?

  A `BirthdayPartyTheme` can either be a `Vehicle` or a `Color`. We would add the number of possible `Vehicle`s to the number of possible `Color`s.

  `3 + 3 = 6`

  How about the number of different possible `Ride`s?

  A `Ride` must have both a `Vehicle` _and_ a `Color`. We would multiply the terms instead.

  `3 * 3 = 9`

  This is why `BirthdayPartyTheme` is called a sum type and `Ride` is called a product type - 'sum' refers to addition and 'product' refers to multiplication.

  In fact, both `Vehicle` and `Color` are sum types as well.

  `1 + 1 + 1 = 3`

  What's counterintuitive is that a `Yellow` themed birthday party can actually be a lot of fun.

[^3]: The 'adt' in `@morphic-ts/adt` stands for ['Algebraic Data Type'](https://jrsinclair.com/articles/2019/algebraic-data-types-what-i-wish-someone-had-explained-about-functional-programming/). `morphic` uses the term a bit differently than it's classical definition.

  According to [wikipedia](https://en.wikipedia.org/wiki/Algebraic_data_type),

  > an algebraic data type is a kind of composite type, i.e., a type formed by combining other types

  The term is often used in programming to refer to either product types (see above) or sum types, although [pi types and sigma types](https://manishearth.github.io/blog/2017/03/04/what-are-sum-product-and-pi-types/) are also technically ADTs (they rely on [dependent types](https://en.wikipedia.org/wiki/Dependent_type) which is a whole other can of worms).

  In `morphic`, 'ADT' always refers to sum types.

[^4]: `boolean` is technically a [union type not a sum type](https://waleedkhan.name/blog/union-vs-sum-types), but it's functionally a sum type.