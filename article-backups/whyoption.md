![lazy chaos coordinator](https://images-na.ssl-images-amazon.com/images/I/51dZDQWbo6L._AC_UL600_SR369,600_.jpg)

# tl;dr

`Task` is actually a form of `IO`. Like Fluture's `Future`, this makes `Task` lazy, but unlike `Future`, `IO` is never meant to be invoked directly.

# Contents

- [Future Rocks](#future-rocks)
- [Type Safety](#type-safety)
- [fork is Missing](#fork-is-missing)
  * [What is Invocation](#what-is-invocation)
    + [Advantage of Laziness](#advantage-of-laziness)
    + [Short Circuit Evaluation](#short-circuit-evaluation)
  * [What is fork](#what-is-fork)
  * [Why is it Missing](#why-is-it-missing)
  * [What is IO](#what-is-io)
  * [Wait What](#wait-what)
  * [Forgetting to Invoke IO](#forgetting-to-invoke-io)
  * [IO Entry Point](#io-entry-point)
    + [hyper-ts](#hyper-ts)
    + [redux-observable](#redux-observable)
- [Conclusion](#conclusion)

# Future Rocks

Much like `TaskEither`, [Fluture's `Future`](https://github.com/fluture-js/Fluture) is a fully monadic, lazy, asynchronous, failable operation. While `TaskEither` is obviously based on fp-ts, `Future` is based on the older [fantasy land](https://github.com/fantasyland/fantasy-land) functional programming library.

Unlike `Promise`, `Future` has some important advantages over `TaskEither` - it's ensures error handling at compile time, it's able to cancel asynchronous operations, and it has a broader array of combinators.

So why would we ever use `TaskEither`? Is it getting warm in here? Is anyone else sweating?

This paper aims to prove that `TaskEither` is in fact more powerful than `Future` in two ways: purity and type-safety.

# Type Safety

This argument in favor of `TaskEither` is the easiest to make. `fp-ts` was designed with Typescript in mind, whereas `fantasy land` was created before Typescript existed.

The crown jewel of `fp-ts` and what sets it apart from other fp libraries is its static higher kinded types. Fluture's author, Aldwin Vlasblom, [discusses this](https://github.com/francisrstokes/arcsecond/issues/25#issuecomment-567093054) in the issue tracker for fantasy land.

This means that it's not possible using `fantasy land` to ensure at compile time that any given typeclass instance properly conforms to its typeclass - monad, functor, applicative functor, any of them.

For example, we can be sure that `TaskEither` works with `sequenceT`, just like any other arbitrary Applicative implementation. In my eyes, this makes `fp-ts` a more powerful library than `fantasy land`, although `fantasy land` is a great solution for developers who aren't able to use Typescript.

There are other reasons `fp-ts` is more powerful - [static combinators](https://jrsinclair.com/articles/2020/whats-more-fantastic-than-fantasy-land-static-land/) and [tree shaking](https://github.com/gcanti/fp-ts/issues/1044) come to mind - but those are outside the scope of this article.

# fork is Missing

This one is a bit trickier to explain. Earlier, I mentioned that `Future` ensures error handling at compile time. As we have seen in [`Should I Use fp-ts Task`](https://dev.to/anthonyjoeseph/should-i-use-fp-ts-task-h52), `TaskEither` can make no such guarantees. So how is `Future` able to do this?

The answer is in `Future`'s invocation function - `fork`, which accepts a handler for both the error case and the resolution case. Now let's back it up and see what all that actually means.

## What is Invocation

`Task` is 'lazy' and it must be 'invoked' or else it won't run. `Future` is the same way. What does this mean?

Let's take a look at a type defintion for `TaskEither`:

```ts
type TaskEither<E, A> = () => Promise<Either<E, A>>
```

`TaskEither` is simply an [anonymous function](https://stackoverflow.com/questions/16501/what-is-a-lambda-function) returning a Promise. When we call that function, we say that we have 'invoked' that `Task`.

```ts
const a: TaskEither<string, number> = () => Promise.resolve(E.right<string, number>(4))
a() // invoking 'a', causing the Promise to execute
```

`Future` is similar. Why would we do this?

### Advantage of Laziness

Vlasblom said about [laziness with regard to his `Future`](https://medium.com/@avaq/im-referring-to-the-fact-that-a-promise-is-eagerly-evaluated-as-opposed-to-lazily-evaluated-5385cc519e3b):

> This means is that whoever gave us a Future didn’t only give us control over _what_ happens with the result of its operation, but also over _if_ and _when_ the operation will happen.

This enables us to have better reasoning about exactly when our asynchronous operations are performed.

### Short Circuit Evaluation

Another advantage of laziness is something called 'short-circuit evaluation'.

You might already be familiar with this concept from [boolean arithmetic](https://typeofnan.dev/short-circuit-evaluation-in-javascript/):

```ts
const first = (): boolean => {console.log('first'); return true }
const second = (): boolean => {console.log('second'); return true }
if (first() || second()) {
  // output:
  // first
}
```

`second()` is never invoked, because the `||` (logical 'or') operator evaluates from left to right, and once it reaches a `true` value, it stops looking.

This is also relevant for the new [nullish coalescing operator '??='](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_nullish_assignment)

What does this have to do with laziness? Well, since they both return from an anonymous function, `first` and `second` are lazy values!

What if we wanted to execute several `TaskEither`s in sequence, and if any of them returns `Left`, stops evaluating the other `TaskEither`s?

```ts
import { flow } from 'fp-ts/function'
import { pipe } from "fp-ts/pipeable"
import * as A from 'fp-ts/Array'
import * as T from 'fp-ts/Task'
import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'

const delayPromise = (millis: number) =>
<V>(value: V): Promise<V> => new Promise(
    resolve => setTimeout(() => {
      console.log(`evaluating ${value}`)
      resolve(value)
    }, millis)
  )

const delayTask = (millis: number) =>
  <V>(value: V): TE.TaskEither<string, V> => TE.tryCatch(
    () => delayPromise(millis)(value),
    () => 'error',
  )

const completed = flow(
  A.map(String),
  ss => ss.join(),
  console.log,
)
const taskArray = [
  delayTask(1000)(1),
  delayTask(2000)(2),
  TE.left<string, number>('short circuit'),
  delayTask(3000)(3),
  delayTask(4000)(4),
]

const result: Promise<void> = pipe(
  taskArray,
  A.sequence(TE.taskEitherSeq),
  TE.map(completed),
  T.map(E.getOrElse(console.error)),
  invokeTask => invokeTask(),
)
// output:
// evaluating 1
// evaluating 2
// short circuit
```

What if we try to do the same thing with `Promise.all`?

```ts
const promArray = [
  delayPromise(1000)(1),
  delayPromise(2000)(2),
  Promise.reject('short circuit'),
  delayPromise(3000)(3),
  delayPromise(4000)(4),
]

const result: Promise<void> = Promise.all(promArray)
  .then(completed)
  .catch(console.error)
// output:
// short circuit
// evaluating 1
// evaluating 2
// evaluating 3
// evaluating 4
```

Every `Promise` is run. `Promise` is 'eagerly' evaluated (the opposite of 'lazy'), so they're all invoked when they're created inside `promArray`

To be honest, it's not an accurate comparison, since it's impossible to chain `Promise`s in sequence [without using `then`](https://stackoverflow.com/questions/24586110/resolve-promises-one-after-another-i-e-in-sequence)

If we want to invoke an `Array` of `TaskEither` in parallel, we just use the other monad instance for `TaskEither` like this: `A.sequence(TE.taskEither)`. This will output

```ts
// evaluating 1
// evaluating 2
// evaluating 3
// evaluating 4
// short circuit
```

`A.sequence(TE.taskEither)` awaits the output of every `TaskEither` before coalescing their outputs, which is why it prints 'short circuit' after all the evaluation. This makes it closer to `Promise.allSettled` than `Promise.all`. I mention this to show that the lazy nature of `TaskEither` makes it simpler, more intuitive and more flexible than `Promise`.

Lazy evaluation as a whole is not without disadvantages. [Here](https://www.youtube.com/watch?v=E5yAoMaVCp0) is a great video by [tsoding](https://tsoding.org/) showing how a traversal of a lazy linked list can become tricky and expensive. However, I argue that in the context of asynchronous operations, laziness is a benefit.

## What is fork

We have a major problem with `TaskEither`. If we invoke a `TaskEither` directly, we're able to discard our error value without doing anything about it.

```ts
const a: TE.TaskEither<string, void> = TE.left('failure')
a()
```

Type signatures aside, this is no better than an unchecked exception, and we've discussed the problems with those. How can we ensure that we handle our errors at compile time?

The same problem is mentioned in Duncan McGregor's [Failure is not and Option](http://oneeyedmen.com/failure-is-not-an-option-part-4.html), in the context of functions that return an `Either` type:

> We could return Either<IOException, Unit> in these cases, but as the caller is not processing a return value, it is easy to ignore the error as well ... [this only works] for functions where the caller is relying on using the result.

`Fluture` solves this problem with `fork`. `fork` accepts two ([curried](https://en.wikipedia.org/wiki/Currying)) arguments - an error handler and a resolution handler. `fork` is powerful because it's the only way to invoke a `Future` - meaning that it's required at compile time to handle both the rejection and resolution cases.

```ts
import * as F from 'fluture'

const a: F.FutureInstance<string, number> = F.Future<string, number>(
  (reject, resolve) => {
    resolve(3)
    // return function is a callback invoked on cancellation
    return (): void => {}
  }
)
const invoked: F.Cancel = pipe(
  a,
  F.fork(
    (err: string) => `error: ${err}`
  )(
    (val: number) => `resolved: ${val}`
  ),
)
```

A similar idea was proposed as part of the [Promise/A+ spec](https://brianmckenna.org/blog/category_theory_promisesaplus) back when it was being decided upon.

## Why is it Missing

`TaskEither` has no equivalent of `fork`. You must invoke it unsafely.

In my article [Should I Use fp-ts Task](https://dev.to/anthonyjoeseph/should-i-use-fp-ts-task-h52), I propose a self-imposed 'rule' as a solution to the problem. But why don't we just make a pull request to `fp-ts` and add a `fork` operation to `TaskEither`?

Because `Task` is actually a kind of IO. Here's a quote from Giulio Canti's (the creator of `fp-ts`) [Introduction to Functional Programming](https://github.com/gcanti/functional-programming#funzioni-come-programmi) ([english translation](https://github.com/enricopolanski/functional-programming#functions-as-programs))

| Type constructor | Effect (interpretation)                     |
| ---------------- | ------------------------------------------- |
| `Option<A>`      | a computation that may fail                 |
| `IO<A>`          | a synchronous computation with side effects |
| `Task<A>`        | an asynchronous computation                 |

```ts
interface Task<A> extends IO<Promise<A>> {}
```

This is an interesting type definition of Task - it's actually a form of `IO`.

## What is IO

As we can see from the table above, `IO` is

> a synchronous computation with side effects

`IO` is fundamental concept to pure functional programming. It stands for __I__nput and __O__utput.

`IO` is defined in `fp-ts` like so:

```ts
type IO<A> = () => A
```

This is familiar! `IO` is just a lazy value. This is why `Task` is `IO` - `Task` is just a lazy promise.

The important thing about `IO` is that it wraps values obtained through 'side-effects' - meaning an effect that cannot be represented in the type system.

```ts
import * as IO from 'fp-ts/IO'

const getInput: (numLines: number): IO.IO<string> => ...
const printOutput: (lineBreaks: boolean): IO.IO<void> => ...
```

Referential transparency, an important asset for code, means that all possible outcomes of a function are represented in its type signature. This is the meaning of a pure function - a function that has no side effects unrepresented in its type signature.

In react, `Component` is called `Pure` if it's stateless - theoretically meaning there are no side effects to it's render logic. The JSX element it output was a pure function of it's input (props), and it given the same input it will always have the same output. The name `Pure` comes from this same idea of referential transparency. `IO` helps us maintain purity by representing a side-effect in the type system - it tells us exactly which parts of the program are impure, allowing us to keep a clear separation of the two.

`IO` is lazy for the reasons listed above - short-circuit evaluation and reasoning about _when_ the operation is invoked, as well as a reason discussed in the [previous post](https://dev.to/anthonyjoeseph/taskeither-vs-promise-2g5e) - it allows `IO` to nest (aka [conform to the monad laws](https://dev.to/anthonyjoeseph/why-is-fp-ts-option-like-that-3k6c)).

`fp-ts` has modules for the [console](https://github.com/gcanti/fp-ts/blob/master/test/Console.ts) and the [browser canvas](https://github.com/gcanti/graphics-ts/blob/master/test/Canvas.test.ts), that wrap effectful operations in `IO`. This is useful because once an `IO` value has been introduced, we always know that an effect has taken place beyond what our other types are able to represent. `IO` can be thought of as representing a [change to the universe as a whole](https://www.youtube.com/watch?v=fCoQb-zqYDI).

`IO` is valueable because it demarcates a value as having been the result of some side effect. This means that for `IO` to be useful, _it can never be unwrapped_ (read: invoked).

## Wait What

Hold up. Does this mean that we can't ever invoke `Task`? Strictly speaking, yes. The developer themself is never meant to invoke `Task` - the wrapper is too valuable. Having a value wrapped in `Task` ensures that we know that the value exists sometime in the future, and that we affected some kind of change on the outside world by the time we have it.

Rather than invoking `Task`, or any `IO` for that matter, we're meant to compress all of our `IO` down into one value and hand it off to an entry point that can handle it. I'll explain what this means in a minute, but for now, I feel like I should explain the big reason why we might want to avoid invoking `IO`. Purity's nice and all, but there's a killer feature here, hiding just under the surface.

## Forgetting to Invoke IO

The major unaddressed problem in the room is this:

```ts
const onClick = (): Task<void> => pipe(
  fetchValue,
  T.map(E.fold(
    displayError,
    updateState,
  ))
)

```

Can you see the problem? It's a little hard to spot. We forgot to invoke `Task`!

`Fluture`'s `fork` handles error cases at compile time, but doesn't do anything about this other huge problem - what if you forget to use `fork` at all?

We addressed this in [Should I use fp-ts Task](https://dev.to/anthonyjoeseph/should-i-use-fp-ts-task-h52) with a self-imposed 'rule' that we always explicitly type our invoked `Task` as `Promise`:

```ts
const onClick = (): Promise<void> => pipe(
  fetchValue,
  T.map(E.fold(
    displayError,
    updateState,
  )),
  invokeTask => invokeTask(),
)
```

But this is even easier to forget than `fork`. How can we solve this? And how are we meant to use `IO` if we can never invoke it? It turns out that these questions answer each other.

## IO Entry Point

What we want is something like the haskell `main` entry point - a single [entry point](https://en.wikipedia.org/wiki/Entry_point) that evaluates a single `IO` value. Then, we can combine all of our `IO`s together (sequentially if we want - `IO` is a monad after all) and output them all from that point.

```hs
main :: IO ()
main = do putStrLn "What is 2 + 2?"
          x <- readLn
          if x == 4
              then putStrLn "You're right!"
              else putStrLn "You're wrong!"
```

(example stolen from [Learn Haskell in 10 minutes](https://wiki.haskell.org/Learn_Haskell_in_10_minutes))

This idea, [originating from haskell](https://www.microsoft.com/en-us/research/wp-content/uploads/1993/01/imperative.pdf), is common across pure functional languages. [Purescript](https://github.com/purescript/documentation/blob/master/guides/Getting-Started.md#creating-executables) and [Elm](https://guide.elm-lang.org/architecture/buttons.html) also have `main`, and Scala cats has [IOApp](https://typelevel.org/cats-effect/datatypes/ioapp.html) which operates similarly.

Scala uses an interesting terminology - it's said that `IO` is not evaluated until the ["end of the world"](https://typelevel.org/cats-effect/datatypes/ioapp.html#why-is-it-specialized-for-io). The metaphor being that our lazy evaluator procrastinates so bad that the only kind of event that could possibly cause it to run would be cataclysmic. The epitome of _true_ laziness. Practically speaking, "the end of the world" happens when you run your program.

Here are a couple examples of `IO` entry points that work with `fp-ts` `IO` - `hyper-ts` on the backend and `redux-observable` on the frontend.

### hyper-ts

`hyper-ts` is a library that allows type-safe connection handling for an `express` server. You can be sure at compile-time that you are responding to each request with a single response, with a parsed request body and with the head and body written in the correct order.

It's a remarkable library that prevents behavior that shouldn't be allowed in the first place and provides powerful integrations like runtime type validation out of the box.

The `Middleware` type is the core of the library. It's used to translate `Connection` values into the correct state.

```ts
export interface Middleware<I, O, E, A> {
  (c: Connection<I>): TE.TaskEither<E, [A, Connection<O>]>
}
```

The type is too complicated to go into, but notice that it's built around the `TaskEither` type. Naturally, `Middleware` has both `fromTaskEither` and `fromIOEither` functions (and ones for plain `IO` and `Task` as well) that upconvert from `TaskEither` and `IOEither`.

While a chain of `Middleware`s isn't exacly a single 'entry point' for the entire server, it is an 'entry point' for a single endpoint.

Notable fp blogger [Tim Ecklund's](https://dev.to/gnomff_65) [hyper-ts is My Cyborg Brain](https://dev.to/gnomff_65/hyper-ts-is-my-cyborg-brain-34kf) has a detailed explanation and example application for `hyper-ts`, including a usage of the `fromTaskEither` function.

It's worth mentioning that if left unhandled, the error case in `TaskEither` is passed into the `next` function of the express route. This is [standard default behavior](https://expressjs.com/en/guide/error-handling.html#the-default-error-handler) for express applications. The error will be written to the client with the stack trace. The stack trace is not included in the production environment.

### redux-observable

If you use react or vue.js, redux-observable can be a great `IO` entry point. The basic idea is very simple, though a little tricky to explain - every side effect in the app is represented as a sum type called an 'Action', and these 'Actions' are represented as an rxjs stream called an `Observable`.

Since an `Observable` represents a potentially infinite stream of asynchronous operations, `Task` can easily be converted into a stream. `fp-ts-rxjs`, a library created to bind `rxjs` and `fp-ts` together, has a function called `fromTask`, as well as a `fromIO`.

Check out my article [Should I Use redux-observable? Also What is it? Also Let's be Honest what's Redux?](https://dev.to/anthonyjoeseph/should-i-use-redux-observable-also-what-is-it-also-let-s-be-honest-what-s-redux-2hba) for a thorough yet hopefully simple explanation with examples. 

I also recommend using `Observable` if you need cancellation and you'd rather use `TaskEither` than `Fluture` (which I think you probably should)

# Conclusion

This is the diciest topic yet. Properly using `IO` for Typescript is a tricky proposition, especially since it can feel unnecessary, even arbitrary.

When [describing what a Functor](https://www.youtube.com/watch?v=bT3wsZgrZto&t=125s) is, tsoding made a great point about pure functional programming more broadly:

> Rust developers like to unwrap everything ... they cannot work with values unless they unwrap them ... In haskell world, we inject functions into things, and modify them from within.

Properly using `IO` isn't about unwrapping it's value, it's about leaving the value where it is and changing it from within. It's a powerful paradigm shift, and one whose benefits we've explored.

Of course, it's not always worth the added complexity. Like with many of these articles about `fp-ts`, it ends up being a shade of grey in the end. And as usual, it's probably not worth retrofitting an entire existing application to use `redux-observable` if it doesn't already - the pros just don't outweigh the cons. And for a simple application, or one that just doesn't need streams, simply following some arbitrary rules for `TaskEither` can be plenty. 

There's a great discussion in the `fp-ts` issue tracker that brings up the topic of ['bubbles of purity'](https://github.com/gcanti/fp-ts/issues/900). I'll quote Toni Ruottu's comment in its entirety:

> Essentially, what you have at the moment is a tiny bit of functional code inside an imperative React app. There is strictly speaking nothing wrong about that. It just means you are using fp-ts in a rather limited scope. You could proceed to create other such functional "bubbles" inside your app. This just means that your overall architecture will remain imperative.

> Having only one Task or IO means you have managed to defined your application architecture in a functional manner. Your functional React app would then contain imperative bubbles. However, the imperative bubbles would never be executed in the functional context. Instead your code would simply combine the imperative bubbles and return them towards the application root.

> The benefit of going 100% functional is that reasoning about the code becomes easier since the imperative bubbles that create unexpected consequences are executed "outside" your application. However, this also means less control over what the computer is doing since you are describing ideas rather than actions.

> Ultimately you need to decide what parts of your app are functional or imperative. Functional parts will have more clarity while the imperative parts give you more precise control over execution.

I think it's profound that the very nature of `IO` is to create an 'imperative bubble'. We can extend this to say that any implementation in any language, from haskell to C, exists along a kind of 'purity' spectrum, and that proper or improper usage of 'IO' is only one facet of this. Total purity is not an end in and of itself; it's not even possible, let alone realistic.

True to its name, `fp-ts` does its best to provide a pure functional programming experience. Unlike fantasy land's `Fluture` which is designed for today's more imperative environment, `fp-ts` actually does inhabit a kind of 'typed-language fantasy land' where `IO` is universally referentially transparent. This is why, originally, `fp-ts` stood for 'fantasy problem - terribly strict' [citation needed].

However, with the right tooling, we can work towards a fantastical `Future` (quite a `Task`). With time we might see a shift in paradigm among web developers all over. `fp-ts` can take us to new heights, show us broader horizons, and in time maybe people will take the leap. Someday we can live in a [world of purescript integration](https://www.youtube.com/watch?v=RZ-uV72pQKI)
