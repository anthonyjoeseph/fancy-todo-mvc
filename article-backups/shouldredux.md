![merging streams](https://2.bp.blogspot.com/-oEaLiH6JgEY/Whhg8XgWzsI/AAAAAAAADII/a0pe_PXrpKEv4MFZI5RTTvJHJ-r2XFW-wCK4BGAYYCw/s1600/merging-streams-wallpaper.jpg)

# tl;dr

Use redux if you need a global undo function, you need to work with streams, or if referential transparency is important.

# Contents

- [What's up with redux?](#what-s-up-with-redux-)
- [General Tradeoffs](#general-tradeoffs)
  * [redux](#redux)
  * [recoil](#-recoil--https---recoiljsorg--)
  * [react-query](#-react-query--https---react-querytanstackcom--)
  * [mobx](#-mobx--https---mobxjsorg-getting-started-)
- [What's redux?](#what-s-redux-)
- [What's redux-observable?](#what-s-redux-observable-)
- [Wait What's an Observable?](#wait-what-s-an-observable-)
- [Ok so what's redux-observable agian?](#ok-so-what-s-redux-observable-agian-)
- [Advantages of Global State](#advantages-of-global-state)
- [Sum Type Utility](#sum-type-utility)

# What's up with redux?

At the time of writing in 2020, `redux` and `redux-observable` appear frequently on job descriptions (although more often they ask for experience with redux-saga, which is similar but less powerful). State management is a popular buzzword. What are these things and why would you use them?

Since I consider `redux` almost useless without `redux-observable`, I'll refer to them interchangeably through this article, although they are in fact separate.

For simplicity's sake, we'll be talking about `redux` as it relates to `react` for this post. `react` is a goot fit, since `redux` is meant to model elm, which it does most effectively when paired with `react`.

# General Tradeoffs

`redux` is not the only popular state management library. Here's an overview of redux as compared to its major alternatives

## redux 

Pros:

- implementing global undo is trivial
- natural solution for global event handling (aka routing)
- seamlessly integrates with timers, progress indicators, websockets, any kind of "streaming" data source
- sophisticated debug system
- global state = illegal states become unrepresentable. Reduce or eliminate null checking
- nearly total referential transparency
- decoupled side effects enable dependency injection & unit testing

Cons:

- [colocated state is faster](https://kentcdodds.com/blog/state-colocation-will-make-your-react-app-faster/) (though React.memo can solve this)
- colocated state can be simpler to reason about
- colocated state is kinda the whole point of react (though you're certainly still allowed to use hooks for textfield input etc)
- adding new behavior is cumbersome
- applications with many different behaviors can become unwieldy
- unit testing effectful code is less useful and more complex than integration testing with react-testing-library
- the debug system is a bit arbitrary unless paired with a hot reloader

## [recoil](https://recoiljs.org/)

Pros:

- memoized changes of shared state across a variable number of components

Cons:

- no compile time guarantees about application state as a whole

## [react-query](https://react-query.tanstack.com/)

Pros:

- logical separation of "server cache", which models async data as a cache, and "client state", which more directly affectts the ui
- polls a server with periodic refetching

Cons:

- tight coupling of render logic and fetching logic
- no compile-time guarantees about application state as a whole

## [mobx](https://mobx.js.org/getting-started)

Pros:

Cons:

- mutable state
- run imperative code based on [derived state](https://reactjs.org/blog/2018/06/07/you-probably-dont-need-derived-state.html)

My general take is that state management is often a solution in search of a problem. [`redux` became popular](https://kentcdodds.com/blog/application-state-management-with-react) as a solution to [prop drilling](https://kentcdodds.com/blog/prop-drilling), which can now be solved with simple [react context](https://www.toptal.com/react/react-context-api). Unless you need some of the benefits outlined above, I would advise against using a state management library at all. `react` itself is a [fantastic state management libary](https://kentcdodds.com/blog/application-state-management-with-react).

Full disclosure: I have zero production experience with any of these besides redux. The rest of the pros and cons are from cursory research, so take them with a big grain of salt. If you have any relevant experience, ideas or corrections please let me know in the comments!

# What's redux?

`redux` models the elm architecture. The application keeps all its state in one object at the root level ('state' in `redux`, 'model' in elm). All possible state changes are represented as a sum type ('Action'[^1] in `redux`, 'Msg' in elm). There's a function that takes the old state and an action as inputs, and outputs a new state ('reducer' in `redux`, 'update' in elm)

```ts
const reducer: (state: State, action: Action) => State = ...
```

It's so simple, we can easily implement it ourselves:

```tsx
import React, { useState } from 'react'

type State = number

enum Action {
  Increment,
  Decrement
}

const reducer = (state: State, action: Action): State => {
  switch(action) {
    case Action.Increment:
      return state + 1
    case Action.Decrement:
      return state - 1
  }
}

const Root = () => {
  const [state, setState] = useState<State>(0)
  const dispatch = (action: Action) => setState(state, reducer(action))
  return (
    <>
      <div>
        Count: {state} 
      </div>
      <button
        onClick={() => dispatch(Action.Increment)}
      >
        +
      </button>
      <button
        onClick={() => dispatch(Action.Decrement)}
      >
        -
      </button>
    </>
  )
}
```

That's the basic idea!

In `react-redux`, the root `State` and the `dispatch` function are both wrapped in react context so they can be accessed by every component.

While there's a little more to it, this is enough to move on (and enough for ~80% of your work with redux)

# What's redux-observable?

What if we need to change the state asynchronously?

```ts
type Data = ...
const fetchAsyncData: () => Promise<Data> = ...

const reducer = (state: State, action: Action): State => {
  switch(action.type) {
    case 'FetchData':
      const newState: Promise<State> = fetchAsyncData()
        .then((asyncData: Data): State => ({
          ...state,
          asyncData,
        }))
      return ???
  }
}
```

We can't return `newState` because reducers are synchronous. We'll need an async middleware to handle this case. What does that mean?

`redux` uses middleware, just like `express` does. This means that you can add additional functionality to your dispatcher. This is how you use the [sophisticated debug system](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd) I mentioned earlier.

`redux-observable` is the most powerful async middleware. It combines an `Observable` with the `dispatcher`.

# Wait What's an Observable?

`Observable` comes from the library `rxjs`. It represents a stream of data.

What's a stream? Where `Promise` represents an asynchronous value with one single output, an `Observable` represents an asynchronous value with many.

The same way you would model the callback in `setTimeout` as a `Promise`, you would model the callback in `setInterval` as an `Observable`

```ts
import { Observable } from 'rxjs'

const output: Promise<string> = new Promise(res => {
  setTimeout(() => res('output'), 1000)
})
const output$: Observable<string> = new Observable(sub => {
  setInterval(() => sub.next('output'), 1000)
})

output.then(console.log)
// output

output$.subscribe(console.log)
// output
// output
// output
// ...
```

By convention, we [use the '$' character as a suffix](https://stackoverflow.com/a/43083604/615493) for `Observable` values.

`rxjs` is powerful because `Observable` has [many combinators and operations](https://www.learnrxjs.io/learn-rxjs/operators)

A quick note: like `Promise`, `Observable` models unchecked exceptions with optional error handling. If these concepts is unfamiliar, check out my series called 'Why is TaskEither Like that?'. I recommend using an `Either` type to model errors with more type safety. `fp-ts-rxjs` provides a great type alias called [`ObservableEither`](https://github.com/gcanti/fp-ts-rxjs/blob/master/test/ObservableEither.ts) that's similar to `TaskEither` for this purpose.

# Ok so what's redux-observable agian?

`redux-observable` adds a function called an `Epic`, which takes an `Observable<Action>` and returns an `Observable<Action>`

```ts
const epic: (action$: r.Observable<Action>) => r.Observable<Action> = ...
```

Let's revisit our earlier example, this time with `redux-observable`:

```ts
import { pipe } from 'fp-ts/pipeable'
import * as r from 'rxjs'
import * as ro from 'rxjs/operators'

interface FetchData { type: 'FetchData' }
interface UpdateData { type: 'UpdateData'; data: Data }
type Action = FetchData | UpdateData

const epic = (action$: r.Observable<Action>): r.Observable<Action> => pipe(
  action$,
  ro.filter((action: Action): action is FetchData => action.type === 'FetchData'),
  ro.map((_: FetchData): Promise<Data> => fetchAsyncData()),
  ro.switchMap((resp: Promise<Data>): r.Observable<Data> => r.from(resp)),
  ro.map((asyncData: Data): Action => ({ type: 'UpdateData', asyncData })),
)

const reducer = (state: State, action: Action): State => {
  switch(action.type) {
    case 'UpdateData':
      return {
        ...state,
        action.data,
      }
    default:
      return state
  }
}
```

This may seem like a complex way to update state asynchronously, and it is. Here's comparable code using vanilla react:

```tsx
import React, { useState } from 'react'

const AsyncData = () => {
  const [asyncData, setAsyncData] = useState<Data | undefined>(undefined)
  const onClick = () => fetchAsyncData().then(setAsyncData)
  ...
}
```

Why would we use `redux-observable`? As I mentioned earlier, `Observable` has many operators and combinators. We can easily compose multiple streams together. If this was all the functionality we needed, I would say that `redux-observable` is a bad fit.

What if we also wanted to delete our async data whenever the delete key is pressed? We would simply merge the streams

```ts
const epic = (action$: r.Observable<Action>): r.Observable<Action> => pipe(
  r.merge(
    pipe(
      action$,
      ro.filter((action: Action): action is FetchData => action.type === 'FetchData'),
      ro.map((fetchData: FetchData): Promise<Data> => fetchAsyncData()),
      ro.flatMap((promResponse: Promise<Data>): r.Observable<Data> => r.from(promResponse)),
    ),
    pipe(
      r.fromEvent<KeyboardEvent>(window, 'keydown'),
      ro.filter(e => e.which === 8), // 8 is the key code for 'delete'
      ro.map(() => undefined),
    ),
  ),
  ro.map((asyncData: Data): Action => ({ type: 'UpdateData', asyncData })),
)
```

`redux-observable` is great for global event handling because we have access to the global state. Here, we're able to keep our code naturally DRY because our `FetchData` action and our key event both trigger the `UpdateData` action.

Anyway, it always feels wrong to add an event handler like this to some `componentDidMount` function. Why would we wait for a component to mount to start handling the event? What does a key press have to do with a component at all? `redux-observable` provides a more natural place for this.

[Here's the full code](https://gist.github.com/anthonyjoeseph/7463dac5f41d8d2b3d0aaec5c83e3e84), in case you want to see how to properly set up the `redux-observable` middleware.

# Advantages of Global State

Like elm, `redux` manages global state. There are [well-documented disadvantages](https://redux.js.org/faq/organizing-state) to using global state.

However, whether or not you end up using `redux`, global state is [often the best way to model data](https://reactjs.org/docs/lifting-state-up.html). It has a major advantage often overlooked: type safety.

Let's say we need to implement authentication in a web app. Certain routes and data can only be accessed after we've been logged in. Here's how that might look with vanilla react:

```tsx
import { Route } from 'react-router-dom'

interface AppState {
  user?: User
  data?: SecureData
}

const Routes = ({ state }: { state: AppState }) => (
  <>
    <Route
      path="/authenticated"
    >
      <Authenticated
        user={user}
        data={data}
      />
    </Route>
    <Route
      path="/unauthenticated"
    >
      <Unauthenticated/>
    </Route>
  </>
)
```

We have a few potential errors here:

- What do we display we're at '/authenticated' but we have no `user` or no `data`?
- What if we have a `user` but no data, or vice versa?
- What if we misspell '/authenticated'?
- What if we forget to handle '/unauthenticated'?

We could handle the first two problems with null checking, but this is a bad solution. We know that we only ever want to be at the '/authenticated' route when we have both a `user` and `data`. By null checking here, we are handling an error that's only possible due to a weakness in our system.

We can fix all of this using a sum type:

```tsx
interface Authenticated {
  type: 'Authenticated'
  user: User
  data: SecureData
}
interface Unauthenticated { type: 'Unuthenticated' }
type AppState = Authenticated | Unauthenticated

const Routes = ({ state }: { state: AppState }) => {
  switch(state.type) {
    case 'Authenticated':
      return (
        <Authenticated
          user={state.user}
          data={state.data}
        />
      )
    case 'Unauthenticated':
      return (
        <Unauthenticated/>
      )
  }
}
```

We know at compile time that we can't display our 'authenticated' route unless we have both a `User` and `SecureData`. We can't misspell or forget to handle our routes due to [compile-time exhaustiveness checking](https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html#union-exhaustiveness-checking).

Illegal states are unrepresentable. Errors are pushed to the boundaries of the system. This is the meaning of the [mantra "parse, don't validate"](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/)

Routing is a great example of event handling that `redux-observable` handles well.

```ts
const epic = (action$: r.Observable<Action>): r.Observable<Action> => pipe(
  r.fromEvent(window, 'popstate'),
  ro.map(() => window.location.href),
  ro.flatMap((route: string): Observable<Authenticated | undefined> => {
    switch(route) {
      case '/authenticated':
        return r.from(loadUserAndData())
      default:
        return r.from({ type: 'Unauthenticated' })
    }
  }),
  ro.map((appState: AppState): Action => ({
    type: 'SetAppState',
    appState,
  }))
)
```

For more on parsing a route `string` to a sum type, check out my [fp-ts-routing tutorial](https://dev.to/anthonyjoeseph/type-safe-routing-with-fp-ts-routing-2fli).

# Sum Type Utility

`@morphic-ts/adt` is a great library that provides predicates and a reducer for free.

Let's check out an earlier example with a morphic upgrade:

```tsx
import { makeADT, ofType, ADTType } from '@morphic-ts/adt'

interface FetchData { type: 'FetchData' }
interface UpdateData { type: 'UpdateData'; data: Data }
const Action = makeADT('type')({
  FetchData: ofType<FetchData>(),
  UpdateData: ofType<UpdateData>()
})
type Action = ADTType<typeof Action>

const epic = (action$: r.Observable<Action>): r.Observable<Action> => pipe(
  action$,
  ro.filter(Action.is.FetchData),
  ro.map((action: FetchData) => ...),
)

const defaultState: AppState = ...
const reducer = Action.createReducer(defaultState)(
  {
    UpdateData: (action: Action) => (state: AppState) => ...,
  },
  // default case
  (action: Action) => (state: AppState) => state,
)

// there's also a curried pattern match
const AppState = makeADT('type')(...)
type AppState = ADTType<typeof AppState>
const Routes = ({ state }: { state: AppState }) => AppState.matchStrict({
  Authenticated: ({ user, data }) => (
    <Authenticated
      user={user}
      data={data}
    />
  ),
  Unauthenticated: () => (
    <Unauthenticated/>
  )
})(state)
```

This replaces [typesafe-actions](https://github.com/piotrwitek/typesafe-actions), [redux-actions](https://redux-actions.js.org/introduction/tutorial), and `ofType` in both [ngrx](https://ngrx.io/api/effects/ofType) and [redux-observable](https://github.com/redux-observable/redux-observable/blob/2b6c0ed700b78f86780ac5d2e6ba81d341249a0a/src/operators.ts#L16) by solving the more general problem of sum types.

[^1]: This example's a bit misleading. We can't use `enum` with `redux` because `Action` has to be an object conforming to [this interface](https://github.com/reduxjs/redux/blob/master/src/types/actions.ts#L18): `interface Action<T> { type: T }`

  `enum` can't conform to that, since it's represented with `number` values. I used `enum` for our example simply because I imagine more devs are familiar with `enum` than with 'sum type' or 'union type', which are mostly the same thing.
