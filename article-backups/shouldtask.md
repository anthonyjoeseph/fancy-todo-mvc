![Become a (non-evil) `Task` master!](https://i.annihil.us/u/prod/marvel/i/mg/6/20/5e4c1344bf318/clean.jpg)

# tl;dr

`TaskEither` can enforce type-safe error handling. Always convert with `tryCatch`. Laziness is a mixed blessing. Always return `Promise<void>` when invoking `Task`.

# Contents

- [The Two Problems with Promise](#the-two-problems-with-promise)
    + [`catch` uses `any`](#-catch--uses--any-)
    + [`catch` is optional](#-catch--is-optional)
- [Welcome to Task](#welcome-to-task)
- [Task Rules](#task-rules)
  * [Rule Number 1](#rule-number-1)
  * [Rule Number 2](#rule-number-2)
  * [Rule Number 3](#rule-number-3)
- [Why are there rules this is dumb](#why-are-there-rules-this-is-dumb)
- [Should I use Task](#should-i-use-task)
- [Emotional component](#emotional-component)
- [Conclusion](#conclusion)

# The Two Problems with Promise

Here's an example of a promise using fetch:

```ts
fetch('https://jsonplaceholder.typicode.com/todos/1')
  .then(response => response.json())
  .then(json => console.log(json))
  .catch((err: any) => {
    console.error(error.message)
  })
```

### `catch` uses `any`

We can do this without a compile-time error.

```ts
fetch('https://jsonplaceholder.typicode.com/todos/1')
  .then(response => response.json())
  .then(json => console.log(json))
  .catch((err: any) => {
    console.error(error.mesage) // 'message' is misspelled
  })
```

### `catch` is optional

We can do this without a compile time or runtime error.

```ts
fetch('http://jsonplaceholder.net/todos/-1') // wrong url
  .then(response => response.json())
  .then(json => console.log(json))
```

# Welcome to Task

Here's the definition for `Task`[^1]:

```ts
export type Task<A> = () => Promise<A>
```

How does this help us? All we're doing is returning a `Promise` from an anonymous function.

It's not obvious, but `Task` will solve both of the problems listed above - it'll allow us to enforce consistent error handling at compile time.

However! It doesn't work unless you play by the rules. There are three `Task` rules that you must never violate under penalty of bugs.

# Task Rules

## Rule Number 1

You must always convert `Promise` to `Task` using `tryCatch`.

```ts
const safeAsync: Task<Either<Error, Response>> = tryCatch(
  (): Promise<Response> => fetch('https://jsonplaceholder.typicode.com/todos/1'),
  (err: unknown): Error => {
    if (err instanceof Error) {
      return err
    }
    return new Error(String(err))
  }
)
```

The first parameter is a function that returns a `Promise`. I'll explain why this is a function and not just a `Promise` later.

The second parameter forces us to catch the errors from the `Promise` from the first parameter. The potential error is represented as an `unknown` instead of an `any`.

`unknown` is safer than `any` because `unknown` forces us to [narrow the type](https://43081j.com/2019/02/typescript-avoid-using-any). In this case, we're narrowing with `instanceof`.

Check out that return type. Our `Task` will return something called an `Either`. An `Either` is either an error value or a success value, but never both. We call the error value `Left` and the success value `Right` [by convention](https://hackage.haskell.org/package/base-4.14.0.0/docs/Data-Either.html). Here's the [definition](https://github.com/gcanti/fp-ts/blob/a5f06e7172eab0fe36ea72ae19263e2d78cc3200/src/Either.ts#L63) of Either:

```ts
interface Left<E> {
  _tag: 'Left'
  left: E
}
interface Right<A> {
  _tag: 'Right'
  right: A
}
type Either<E, A> = Left<E> | Right<A>
```

Let's look again at our return value:

```ts
Task<Either<Error, Response>>
```

This means that our Task will return either an `Error` or a `Response` (`fetch` [returns a type called `Response`](https://microsoft.github.io/PowerBI-JavaScript/interfaces/_node_modules_typedoc_node_modules_typescript_lib_lib_dom_d_.response.html)).

Compare this with the return type of `fetch`:

```ts
Promise<Response>
```

We can see that `fetch` will return a `Response`, but we have no idea what its error type might be. Could it have an error? `Task<Either<Error, Response>>` tells us more about what's going on, and holds us to a contract - we must handle both possibilities.

The combination of `Task` and `Either` is so common, it has a type alias called `TaskEither`[^2]:

```ts
type TaskEither<E, A> = Task<Either<E, A>>
```

The `TaskEither` package is actually where we import `tryCatch` from:

```ts
import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'

const safeAsync: TE.TaskEither<Error, Response> = TE.tryCatch(
  (): Promise<Response> => fetch('https://jsonplaceholder.typicode.com/todos/1'),
  E.toError,
)
```

We also have a convenience function called `toError` from the `Either` package that converts `unknown` into `Error` for us.

However, we still have to convert our `Response` into a JSON value[^3]:

```ts
import { pipe } from 'fp-ts/pipeable'

const safeAsync: TE.TaskEither<Error, any> = pipe(
  TE.tryCatch(
    (): Promise<Response> => fetch('https://jsonplaceholder.typicode.com/todos/1'),
    E.toError,
  ),
  TE.chain(response => TE.tryCatch(
    (): Promise<any> => response.json(),
    E.toError,
  )),
)
```

`TE.chain` is similar to `Promise.prototype.then`.

We must wrap `response.json()` in a `tryCatch` because it's a `Promise`.

How will we print the result?

```ts
import * as T from 'fp-ts/Task'

const safeAsync: T.Task<void> = pipe(
  TE.tryCatch(
    (): Promise<Response> => fetch('https://jsonplaceholder.typicode.com/todos/1'),
    E.toError,
  ),
  TE.chain(response => TE.tryCatch(
    (): Promise<any> => response.json(),
    E.toError,
  )),
  T.map(E.fold(
    console.error,
    console.log,
  )),
)
```

`T.map` is also like `Promise.prototype.then`. While `T.chain` means what we must return a `Task`, `T.map` means that we can return anything we like. In this case, we return `void`

`E.fold` lets us do something for both the error case and the success case. In this example, we print simply print them both out to the console, with [appropriate error styling](https://developer.mozilla.org/en-US/docs/Web/API/console#Outputting_text_to_the_console).

Why is it a rule that we have to use `tryCatch`? Because it's possible to create a `Task` like this:

```ts
const unsafeAsync: Task<Response> = () => fetch('https://jsonplaceholder.typicode.com/todos/1')
```

However, this obviously doesn't solve our type-safety problem. What type of error could this cause? This might as well be a plain Promise.

__`Task` is only useful if it [can never fail](https://github.com/gcanti/fp-ts/blob/a5f06e7172eab0fe36ea72ae19263e2d78cc3200/src/Task.ts#L8).__

We do this by representing both failure and success in its return type through `Either`.

## Rule Number 2

You must explicitly type an invoked `Task` as `Promise`

Wait, what does 'invoke' mean?

Well it turns out that this will never run:

```ts
const safeAsync: T.Task<void> = ...
```

Until you invoke it like this:

```ts
// invoking the task
safeAsync()
```

Let's go back to our definition of a `Task`:

```ts
export type Task<A> = () => Promise<A>
```

Since a `Task` is actually a function, "invoking" simply means calling the function.

Wait, when is a `Promise` run anyway? Which of these `Promise`s will be run?

```ts
const a: Promise<void> = new Promise(() => console.log('running a'))
new Promise(() => console.log('running b'))
function later() {
  return new Promise(() => console.log('running c'))
}

// output:
// running a
// running b
```

`Promise`s are ['eagerly' evaluated](https://en.wikipedia.org/wiki/Eager_evaluation), meaning that they're run as soon as they're constructed. The `Promise` returned by the function `later` has not yet been constructed because `later` has not been called yet.

`later` represents a ['lazy' evaluation](https://en.wikipedia.org/wiki/Lazy_evaluation), meaning that the `Promise` will not be run until `later` is called.

Since `Task` is a function, it represents a 'lazy' evaluation of its return value[^4].

Why do this? Well, the main benefit is that it can be easier to reason about what's actually happening. I'll quote something from an [article about Scala](https://medium.com/@sderosiaux/are-scala-futures-the-past-69bd62b9c001) (warning: paywall) that talks about this:

> "With [Promise], our code acts differently according to where we write our code...A [Promise] doesn’t describe an execution, it executes."

By contrast, `Task` describes an execution rather than executing it. This means that we can manipulate a `Task` with `chain` and `map` as much as we want and pass it around the program secure in the knowledge that it hasn't been called yet. We can also invoke the same `Task` multiple times.

The problem is that sometimes, we forget to invoke `Task`! We can solve this by following rule # 2:

```ts
const onClick = (): Promise<void> => ...
```

We have explicitly typed `onClick` so that it __must__ return a `Promise`. If we forget to return a promise, we'll get a compile-time error:

```ts
const onClick = (): Promise<void> => {
  const safeAsync: T.Task<void> = ...
  // this won't compile:
  // return safeAsync
  //
  // this will:
  // return safeAsync()
}
```

I actually prefer to write it this way because I think it's cleaner:

```ts
const safeAsync: T.Task<void> = ...
const onClick = (): Promise<void> => pipe(
  safeAsync,
  invokeTask => invokeTask(),
)
```

## Rule Number 3

You may only ever invoke `Task<void>`. You can never invoke `Task<string>` or `Task<number>` etc.

You should especially avoid invoking a `TaskEither`.

This forces you to handle all of your cases before you run them.

```ts
const safeAsync: TE.TaskEither<Error, any> = ...
const onlyLogCorrect: TE.TaskEither<Error, void> = pipe(
  safeAsync,
  TE.map(console.log),
)
onlyLogCorrect() // we never handled the error case!
const logAll: T.Task<void> = pipe(
  safeAsync,
  T.map(E.fold(
    console.error,
    console.log,
  ))
)
logAll() // we handled all possibilities
```

We can follow rule #2 and rule #3 by returning `Promise<void>` whenever we invoke a `Task`.

```ts
const logAll: Promise<void> = pipe(
  safeAsync,
  T.map(E.fold(
    console.error,
    console.log,
  )),
  invokeTask => invokeTask(),
)
```

# Why are there rules this is dumb

We could come up with a similar set of rules that would make `Promise` safer to use as well. Why go through the trouble of converting everything to `Task` and back again?

As I said earlier, the advantage is type-safety. `Promise` sacrifices a lot of safety by using `any` to represent error values. By converting to `Task` and back, we hold ourselves to the contract of whichever type we decide our error should be.

For even more power and specificity, you can use a union type or sum type to represent all of your different possible errors. This can strengthen a project that must handle more than one possible kind of error (probably most projects).

# Should I use Task

[As with `Option`](https://dev.to/anthonyjoeseph/should-i-use-fp-ts-option-28ed), I advocate always using `Task` as much as possible if the project is new and you are building it from the ground up.

On the flip side, if a project is old and has lots of `Promise`s in it already, it's probably best to store `Promise`s in state and return them from functions, but `Task` can still be useful behind the scenes.

Although the main benefit is error handling, there's also a small benefit of operator readability. `Promise.prototype.then` can return either a `Promise` or some other generic value. The `map` and `chain` operators are separate - `chain` is for returning a `Task`, while `map` is for some other generic value. This makes your code easier to read: you can tell what type of operation is happening from the name of the operator.

# Emotional component

It can feel oppressive at first to use compiler-enforced error handling. Error cases can pile up quickly and it might not be obvious what to do about all of them, or which ones are ok to ignore. On the flip side, `TaskEither` can help you discover errors you hadn't realized were possible. It can be demoralizing to realize that you had been letting errors slip through the cracks.

It can be difficult to have conversations about potential errors with product engineers/ux designers. Although it may seem like a trivial workplace conversation, sometimes it can feel like admitting defeat or failure, or worse, an accusation, to tell them that the product can fail in a way neither of you had expected. It's worth having some self-compassion in those moments.

Or maybe you're your own product person because you're working for a small company, or you're working on a solo project, or things just worked out that way. If that's the case and you find yourself overwhelmed by `Task`, it might be helpful to research some UX patterns for inspiration:
  - https://mobilejazz.com/blog/how-to-handle-errors-properly-ux/
  - http://www.userjourneys.com/blog/ux-guidelines-for-error-handling/
  - https://uxdesign.cc/creating-error-messages-best-practice-in-ux-design-cda3be0f5e16
  - https://medium.com/@m.fomenko/handling-error-codes-right-a-how-to-for-product-managers-6c99a6b9bc3b

# Conclusion

`Task` can be cumbersome compared to `Promise` - conversion is a pain, you have to remember to invoke it, and you have to remember to handle all of its cases.

However, the benefit is a reduction of unexpected errors and an increase in readability. I think this makes `Task` a no-brainer for most projects, whether it's completely integrated, or only used sparingly.

The rules above can help you use `Task` to its fullest advantage and without fear. Remember:

  1. Always convert `Promise` to `Task` using `tryCatch`
  2. Explicitly type an invoked `Task` as `Promise`
  3. Only ever invoke `Task<void>`

I hope `Task` leads you toward a bright future of asynchronous safety and security!

[^1]: `Task` is actually [defined as an `interface`](https://github.com/gcanti/fp-ts/blob/a5f06e7172eab0fe36ea72ae19263e2d78cc3200/src/Task.ts#L30) which is [different](https://microsoft.github.io/TypeScript-New-Handbook/everything/#interface-vs-alias) but weirder looking and basically the same

[^2]: `TaskEither` is also [defined as an `interface`](https://github.com/gcanti/fp-ts/blob/a5f06e7172eab0fe36ea72ae19263e2d78cc3200/src/TaskEither.ts#L41)

[^3]: You can get rid of the `any` type in this code using [io-ts](https://github.com/gcanti/io-ts/blob/master/index.md). io-ts uses `Either` for its errors too - it's a match made in heaven!

[^4]: Returning a value from a parameterless function to make it lazily evaluated is a common pattern called a 'thunk'. In this example, we would say that `later` is a thunk. [According to Eric Raymond](https://en.wikipedia.org/wiki/Thunk#cite_note-1):

  > [The term] was coined after they realized [...] that the type of an argument in Algol-60 could be figured out in advance with a little compile-time thought [...] In other words, it had 'already been thought of'; thus it was christened a thunk, which is 'the past tense of "think"'

  Though we may not have the _value_ yet, the _type_ has already been thought of, or "thunk".