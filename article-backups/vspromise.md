![Many train tracks](https://i.pinimg.com/originals/53/2b/5d/532b5dd5e057950bc8f89b5c0055c43d.jpg)

# tl;dr

`TaskEither` extends the powerful railway-oriented paradigm implemented by `Promise`, and makes it more referentially transparent.

# Promises Rock

`Promise` as a concept dates back to at latest 1976 when [the term was proposed](https://en.wikipedia.org/wiki/Futures_and_promises) by Daniel P. Friedman and David Wise. The idea started catching on in the javascript community in the late 2000s.

In July of this year (2020), Sam Saccone published a [remarkable article](https://samsaccone.com/posts/history-of-promises.html) outlining in detail the history of javascript's `Promise`. It's a fun read, I consider it definitive and I recommend it. I will summarize it here.

Before `Promise`, there was [XMLHttpRequest](https://www.codeproject.com/Articles/1103979/Promises-in-JavaScript-Past-Present-and-the-Future), which used continuation passing style (we'll explain this later). Then, there was MochiKit in 2005, the first implementation of `Promise` in javascript. This was followed by Dojo's `deferredRequest` in 2006 (`Dojo` was the predecessor to `jQuery`), which was decoupled into `Deferred` in 2007, followed by `Promise` in `Waterken Q` in 2009, which that same year became `Q`, which influenced `Dojo` to adopt `Promise`, followed by `jQuery`'s `deferred` in 2010. In 2010, many important foundational asynchronous web apis were shipping (Webcrypto, fetch, IndexedDB, localStorage). This raised the stakes on what was already serious [vhs/beta situation](https://en.wikipedia.org/wiki/Videotape_format_war).

A year earlier, in 2009, Kris Zyp proposed a unified interface that would cover most of these implementations and allow them to inter-operate. This would later became known as the 'Promises/A' spec. Paul Chavard wrote a test suite for it in the Ember.js library, though it was flawed - it didn't correctly describe the 'Promises/A' spec. Domenic Denicola fixed it up and thereby created the 'Promises/A+' spec, which he described in his talk [Boom, Promises/A+ Was Born](https://www.youtube.com/watch?v=V2Q13hzTGmA&app=desktop).

In 2015, 'Promises/A+' became officially codified into ECMAScript 2015 (also known as es6). To quote Saccone:

> The meta win here was the fact that having multiple agreeing implementations showed the TC39 that there was community consensus around the idea of Promises… an idea that a few years earlier was thought to be too esoteric for common use.

Because of this, `Promise` is now supported natively by [96% of browsers worldwide](https://caniuse.com/promises). 'Promises/A+' eventually would unify [_over 70 promise implementations_](https://promisesaplus.com/implementations), massively reducing complexity and confusion. 

Though the A+ spec had to make serious compromises that we'll discuss later, I think it's worth mentioning the tremendous accomplishment that the compromises allowed: a unified `Promise` spec that saved us all from having to learn several different standards, and maybe saved the very idea of a javascript `Promise`.

## Promises are Callback Heaven

Before promises, asynchronous operations had to be done using callbacks. Here's an example stolen from [Arfat Salman](https://blog.bitsrc.io/understanding-javascript-async-and-await-with-examples-a010b03926ea)

```ts
queryDatabase({ username: 'Arfat' }, (err, user) => {
  // handle errors database querying failure
  const image_url = user.profile_img_url;
  getImageByURL(`someServer.com/q=${image_url}`, (err, image) => {
    // handle errors fetching failure
    transformImage(image, (err, transformedImage) => {
      // handle errors transformation failure
      sendEmail(user.email, (err) => {
        // handle errors of email failure
        logTaskInFile('transformed the file and sent user an email', (err) => {
          // handle errors of logging failure
        })
      })
    }])
  })
})
```

The above code uses something called [continuation passing style](http://matt.might.net/articles/by-example-continuation-passing-style/), although it's more often alarmingly referred to as 'callback hell'. According to [Colin Toh](https://colintoh.com/blog/staying-sane-with-asynchronous-programming-promises-and-generators)

> Callback Hell, also known as Pyramid of Doom, is an anti-pattern ... It consists of multiple nested callbacks which makes code hard to read and debug.

Here's the same code, written using `Promise` instead

```ts
queryDatabase({ username: 'Arfat' })
  .then((user) => {
    const image_url = user.profile_img_url;
    return getImageByURL(`someServer.com/q=${image_url}`)
      .then(image => transformImage(image))
      .then(() => sendEmail(user.email))
  })
  .then(() => logTaskInFile('...'))
  .catch(() => handleErrors()) // handle all errors
```

This control flow is improved. The power here is in modelling a callback as a value called a `Promise`.

## Promises are Declarative

From James Coglan's article [Callbacks are Imperative, Promises are Functional](https://blog.jcoglan.com/2013/03/30/callbacks-are-imperative-promises-are-functional-nodes-biggest-missed-opportunity/) (emphasis added)

> If object-oriented programming treats everything as an object, functional programming treats everything as a value – not just functions, but everything.

> ... At its best, functional programming is _declarative_. In imperative programming, we write sequences of instructions that tell the machine how to do what we want. In functional programming, we describe relationships between values that tell the machine what we want to compute, and the machine figures out the instruction sequences to make it happen.

More on that fuzzy word 'declarative' later.

## Promises are Kinda Monads

`then` allows operations to run in sequence. This is a necessary trait for monads, which are also known as ['programmable semicolons'](https://miklos-martin.github.io/learn/fp/2016/03/10/monad-laws-for-regular-developers.html).

Monads are sometimes controversially[^1] described as containers or wrappers (burritos). `Promise` fits this metaphor nicely - a `Promise` 'wraps' a value in a 'container' that the value can never come out of - it exists in that container forever, only able to be changed from within (unless you are cheating with `async`/`await` - more on that later). In the burrito metaphor, the `Promise` is the tortilla and the value is the beans and cheese.

`Promise` is not in fact a monad, but it's similar enough to be worth mentioning. We'll get to the differences later, but if you already understand monads, maybe now you understand `Promise` a little better, and vice-versa.

# Control Flow

Here is an example of error handling using `async`/`await` syntax

```ts
try {
  const val = await getVal()
  try {
    const otherVal = await val.getOtherVal()
  } catch (err: any) {
    console.error('handle getOtherVal error')
  }
} catch (err: any) {
  console.error('handle getVal error')
}
```

Here is the same code with simpler control flow using vanilla `Promise`:

```ts
const otherVal = getVal()
  .catch(() => console.error('handle getVal error'))
  .then(val => val.getOtherVal())
  .catch(() => console.error('handle getOtherVal error'))
```

Here's an example from Jake Archibald's [JavaScript Promises: an Introduction](https://web.dev/promises/#error-handling)

![Complex async flow](https://dev-to-uploads.s3.amazonaws.com/i/m00hhiguwa0hmh445n3o.png)

Here's the implementation using `Promise`

```ts
asyncThing1()
  .then(asyncThing2)
  .then(asyncThing3)
  .catch(asyncRecovery1)
  .then(asyncThing4, asyncRecovery2)
  .catch(() => console.log("Don't worry about it"))
  .then(() => console.log("All done!"))
```

You can imagine that it would be much more complicated to implement this using `async`/`await`. In this sense, simple promises are more powerful than `async`/`await` syntax.

`Promise` also encourages [expression-oriented programming](https://alvinalexander.com/scala/fp-book/note-about-expression-oriented-programming/), which is purer and easier to reason about than [statement-oriented](https://stackoverflow.com/questions/29390812/are-any-languages-strictly-statement-oriented) `async`/`await`.

# Railway oriented programming

`Promise` is able to easily handle this kind of complicated control flow because with one value it models either a rejection or a resolution. This allows combinators like `catch` to handle values implicitly passed down from earlier operations. Take this example:

```ts
const response = validate(request)
  .then(update)
  .then(send)
  .catch(handleFailure)
```

Here's a picture representing this code visually

![railway oriented programming](https://fsharpforfunandprofit.com/assets/img/Recipe_Function_ErrorTrack.png)

That picture is from Scott Wlaschin's influential [Railway oriented programming](https://fsharpforfunandprofit.com/posts/recipe-part2/). You can see two separate 'tracks' - a 'resolution' track above, and a 'rejection' track underneath. In the parlance of railfans, we say that `catch` can 'shunt' our rejection cases back onto the resolution track, while `then` can shunt them right back onto the rejection track.

 `TaskEither` takes railway oriented programming to the next level with an abundance of operators. They're more specific than `then` and `catch` and cover much more potential functionality.

```
                 reject(x)  resolve(y)
                       \      /
                  :     |    |     :
      TE.map (f)  :     |   f y    :  The 'map' function affects the value in
                  :     |    |     :  the resolution track, but if the train
                  :     |    |     :  would've been on the rejection track,
                  :     |    |     :  nothing would've happened.
                  :     |    |     :
                  :     |    |     :
    TE.chain (f)  :     |   f y    :  The 'chain' function affects the value in
                  :     |   /|     :  the resolution track, and allowed the
                  :     |  / |     :  train to change tracks, unless it was
                  :     | /  |     :  already on the rejection track.
                  :     |/   |     :
                  :     |    |     :
TE.fold (f, g)  :    f x  g y    :  The 'fold' function affects both
                  :      \   |     :  tracks, but forces the train to switch
                  :       \  |     :  from the rejection track back to the
                  :        \ |     :  resolution track.
                  :         \|     :
                  :     -    |     :
                  :     |    |     :
                  :     |    |     :
      TE.alt (m)  :     m    |     :  The 'alt' function replaces a train on
                  :     |\   |     :  the rejection track with another one,
                  :     | \  |     :  allowing it to switch tracks.
                  :     |  \ |     :
                  :     |   \|     :
                  :     |    |     :
   TE.orElse (f)  :    f y   |     :  The 'orElse' function is the opposite
                  :     |\   |     :  of the 'chain' function, affecting the
                  :     | \  |     :  rejection branch and allowing a change
                  :     |  \ |     :  back to the resolution track.
                  :     |   \|     :
                  :     |    |     :
                        V    V
```

(This is an adaptation of a railway diagram from Aldwin Vlasblom's article on his [Fluture library](https://dev.to/avaq/fluture-a-functional-alternative-to-promises-21b), which is similar to fp-ts. We'll explore `Fluture` more in the next article)

# Problems with promises

## Model unchecked exceptions

Errors propogated by `Promise` are typed as `any`, which is not good

```ts
const resource: Promise<Resource> = getResource()
resource
  .then((r: Resource) => ...)
  .catch((error: any) => ...)
```

It's also legal to completely omit a `catch` operation

```ts
const resource: Promise<Resource> = getResource()
resource
  .then((r: Resource) => ...)
  //.catch((error: any) => {}) <--- this is perfectly legal
```

This is because `Promise` models unchecked exceptions, which we covered in our last article, [Either vs Exception Handling](https://dev.to/anthonyjoeseph/either-vs-exception-handling-3jmg). The modern solution to this is the `Either` type, which of course is part of `TaskEither`

```ts
import * as TE from 'fp-ts/TaskEither'

const resource: TE.TaskEither<ResourceError, Resource> = getResourceTaskEither()
```

You can see right in the type signature of `resource` that it may return a `ResourceError`. We know at compile-time exactly which errors are possible, and we can't invoke a `Task` without handling both of it's `Either` cases.

## Then and catch are vague

`then` and `catch` are poorly defined functions. They have many different usages that look similar but behave differently. Here, I've noted the equivalent operations for `TaskEither`, which are more descriptive.

```ts
import { pipe } from 'fp-ts/pipeable'
import * as E from 'fp-ts/Either'
import * as T from 'fp-ts/Task'

const transformValueP = Promise.resolve(3)
  .then(n => n + 3)
const transformValueTE = pipe(
  TE.right(3),
  TE.map(n => n + 3)
)

const chainAsyncP = Promise.resolve(3)
  .then(n => Promise.resolve(n + 3))
const chainAsyncTE = pipe(
  TE.right(3),
  TE.chain(n => TE.right(n + 3))
)

const handleAllErrorsP: Promise<number> = Promise.reject(new Error('Illegal'))
  .catch(() => 3)
const handleAllErrorsTE: T.Task<number> = pipe(
  TE.left(new Error('Illegal')),
  T.map(E.getOrElse(() => 3)),
)

const asyncOnErrorP: Promise<number> = Promise.reject(new Error('Illegal'))
  .catch(() => Promise.resolve(3))
const asyncOnErrorTE: TE.TaskEither<Error, number> = pipe(
  TE.left(new Error('Illegal')),
  TE.orElse(() => TE.right(3)),
)

const handleErrorAndValueP: Promise<number> = Promise.resolve(3)
  .then(
    n => n + 3,
    () => 3,
  )
const handleErrorAndValueTE: T.Task<number> = pipe(
  TE.right(3),
  T.map(E.fold(
    () => 3,
    n => n + 3
  )),
)
```

Also note that the type of `handleAllErrorsTE` and `handleErrorAndValueTE` is `Task<number>`, while the rest are `TaskEither` - this is more informative than the `Promise<number>` type that all of the `Promise` values share.

## Non obvious difference btwn catch and then

`then` can accept an error handling callback.

```ts
const example1: Promise<void> = Promise.resolve(3)
  .then(console.log)
  .catch(console.error)

const example2: Promise<void> = Promise.resolve(3)
  .then(
    console.log,
    console.error,
  )
```

These examples are functionally the same. So what's the difference between using the second parameter of `then` and catch?

Here's an example where the behavior is different:

```ts
const example3: Promise<number> = Promise.resolve(3)
  .then(() => Promise.reject(new Error('Illegal')))
  .catch(() => 13)
// example3 === Promise.resolve(13)

const example4: Promise<number> = Promise.resolve(3)
  .then(
    () => Promise.reject('Illegal'),
    () => 13,
  )
// example4 === Promise.reject(Error('Illegal'))
```

The difference arises because both callbacks for `then` can optionally be asynchronous. This means that the `catch` from `example3` can handle rejections from it's `then` operation, while the error callback in `example4` doesn't get the chance to handle the error thrown by it's success callback. 

Here's a railway diagram describing the problem (stolen from [this article on coding game](https://www.codingame.com/playgrounds/347/javascript-promises-mastering-the-asynchronous/the-catch-method))

![then vs catch railway diagram](https://www.codingame.com/servlet/fileservlet?id=16410503367883)

Here's the equivalent using `Task` - note that `example5` and `example6` have entirely different types

```ts
const example5: T.Task<number> = pipe(
  TE.right(3),
  TE.chain(() => TE.left(new Error('Illegal'))),
  T.map(E.getOrElse(() => 13)),
)
const example6: TE.TaskEither<Error, number> = pipe(
  TE.right(3),
  TE.fold(
    () => TE.right(13),
    () => TE.left(new Error('Illegal'))
  ),
)
```

## Promiselike

Quote from Aldwin Vlasblom's [Broken Promises](https://medium.com/@avaq/broken-promises-2ae92780f33) (warning: paywall)

> At the time of drafting the Promises/A+ specification, there were already several existing and popular Promise libraries, and it was important for different implementations to inter-operate. Because of this, it was decided that when users return an object with a then-function into their Promise, it should be assimilated as if it's a Promise.

> ...Automatic assimilation has some drawbacks though:
Firstly, the fact that the mere existence of a then function on an object will make Promises change behaviour, exposes users to the potential danger of accidentally supplying something that looks too much like a Promise, and causing the program to misbehave. Execute the following for an example of Promises misbehaving:

```ts
Promise.resolve({ then: () => console.log("Hello!") }).then(() => {
  console.log('this will never be run')
})
// output:
// Hello!
```

It is also possible, though extremely difficult, to conform to `PromiseLike` accidentally, as I discovered writing [this example code](https://gist.github.com/anthonyjoeseph/72d2c7fe16dea7c39c2a5cb466dcade2).

## Poor Referential Transparency

Here we see a data structure containing two `Promise`s

```ts
const twoPrints: [Promise<void>, Promise<void>] = [
  new Promise(res => {
    console.log('vote!')
    res()
  }), 
  new Promise(res => {
    console.log('vote!')
    res()
  })
]
// output
// vote!
// vote!
```

There is duplicate code here. If code is referentially transparent, we can always refactor code to reduce duplication. Referential transparency means that any expression can be replaced by its value without changing the behavior of the program. Things are what they look like - our intentions are 'transparent'.

```ts
const print: Promise<void> = new Promise(res => {
  console.log('vote!')
  res()
})
const twoPrints: [Promise<void>, Promise<void>] = [
  print,
  print
]
// output
// vote!
```

`Promise` has cached the result of `print` (which was `void`), and will therefore not run it again. It turns out that `Promise` is not referentially transparent.

`Task`, however, is.

```ts
import * as Task from 'fp-ts/Task'

const print: Task<void> = () => new Promise(res => {
  console.log('vote!')
})
const twoPrintsRefactored: [T.Task<void>, T.Task<void>] = [
  print,
  print
]
twoPrints.map(invoke => invoke())
// output
// vote!
// vote!
```

(Example adapted from [this SO post](https://stackoverflow.com/a/27467037/615493) about Scala's `Future`)

This is an extension of the same idea we discussed in the first section - although `Promise` mererly represents a callback pattern as a value, `Task` (due to its laziness) represents an entire asynchronous execution as a value.

This is part of the criticism some people have of the word 'declarative' - while `Promise` is the 'declarative' alternative to a callback, a `Task` is also 'declarative'. `Task` is more referentially transparent, but is it correct to say that it's 'more' declarative? It's a fuzzy word without a clear definition.

Peter Landin discussed this in his seminal 1966 paper [The Next 700 Programming Languages](http://www.cs.cmu.edu/~crary/819-f09/Landin66.pdf) introducing his ISWIM language (apparently this problem is 55 years old). He suggests an alternative word that implies purity - 'denotative', from the realm of mathematics

> The commonplace expressions of arithmetic and algebra have a certain simplicity that most communications to computers lack. In particular, (a) each expression has a nesting subexpression structure, (b) each subexpression denotes something (usually a number, truth value or numerical function), (c) the thing an expression denotes, i.e., its “value”, depends only on the values of its subexpressions, not on other properties of them.

> ...The word “denotative” seems more appropriate than nonprocedural, declarative or functional. The antithesis of denotative is “imperative.”

By this definition, neither `Promise` nor `Task` is denotative because they perform side-effects. A truly useful word!

## Promises aren't Monads

A rigidly defined category theoretical monad conforms to [three different laws](https://wiki.haskell.org/Monad_laws). Here the one called 'left identity'

```ts
const printLine = (line: string): Promise<void> =>
  new Promise(res => setTimeout(res, 0))
    .then(() => console.log(line))

// Left Identity: the following two statements are equivalent
printLine('vote!')
// output
// 'vote!'

Promise.resolve('vote!').then(printLine)
// output
// 'vote!'
```

However, `Promise.resolve` flattens & invokes any `Promise` passed into it, which breaks the left identity.

```ts
const printFirstThen = (next: Promise<void>): Promise<void> =>
  new Promise(res => {
    console.log('first')
    res()
  }).then(() => next)

printFirstThen(printLine('second'))
// output:
// first
// second

Promise.resolve(printLine('second')).then(printFirstThen) // type error
// Type 'void' is not assignable to type 'Promise<void>'
```

It's a type error - it won't even run. But even if we finagle the value to compile, it still has unexpected behavior:

```ts
Promise.resolve(printLine('second'))
  .then(output => printFirstThen(Promise.resolve(output)))
// output:
// second
// first
```

This happens because `Promise.resolve` invokes the `Promise` returned by `printLine` and forces it to resolve before moving on to `printFirstThen`.

Hopefully this example shows that this is strange behavior that can lead to unexpected results.

Here's how `Task` is able to pass the left identity:

```ts
const printLineT = (line: string): T.Task<void> =>
  () => printLine(line)
const printFirstThenT = (next: T.Task<void>): T.Task<void> => pipe(
  () => new Promise(res => {
    console.log('first')
    res()
  }),
  T.chain(() => next),
)

printFirstThenT(printLineT('second'))
// output:
// first
// second

pipe(
  T.of(printLine('second')),
  T.chain(printFirstThen),
  invoke => invoke()
)
// output:
// first
// second
```

The behavior of `Task` is more consistent than the behavior of `Promise`.

### Promises can't nest

There are times where we might want to nest `Promise`. For example, let's say we have the following two functions.

```ts
const getInput = (): Promise<string> => ...
const query = (input: string): Promise<Response> => ...
```

This function composing the two would be nice:

```ts
const queryFromInput = (): Promise<Promise<Response>> => ...
```

From the original thread [proposing nestable promises](https://github.com/promises-aplus/constructor-spec/issues/24#issuecomment-16310925):

> This type is quite exquisite. It explicitly shows that there are two different threads of execution involved here - three if you include the present thread of execution - and we have access to either one. In fact, we have access to the response thread from within the userInput thread, which is something we lack if Promises are pre-flattened.

Again, although the type signature is legal, this function is impossible to implement due to the strange auto-flattening nature of promises.

## Eagerness Complicates Nestability

Even if it could exist, a nested `Promise` would pose a problem. Since the creation of a `Promise` immediately invokes its execution, it's difficult to predict how a nested `Promise` would behave. The inner `Promise` could execute before the outer `Promise`, or vice versa - there's no way to know without looking at the implementation details.

```ts
// if promises nested, we'd have a 'map' that wouldn't flatten
Promise.prototype.map = <A>(a: A): Promise<A> => ...

//         this one executes first
//                  vvv
const outerFirst: Promise<Promise<void>> = new Promise(res => {
  console.log('outer first')
}).map(() => new Promise(res => {
  console.log('inner next')
}))

const inner = new Promise(res => {
  console.log('inner first')
})
//                 this one executes first
//                          vvv
const innerFirst: Promise<Promise<void>> = new Promise(res => {
  console.log('outer next')
}).map(() => inner)
```

Eager evaluation does not preclude nestability - Scala's `Future` unfortunately has both. It has the behavior described above, which is unnessecarily complicated and not very referentially transparent.

Nested `Task`s always run from the innermost component outward.

```ts
const inner: T.Task<void> = () => new Promise(res => {
  console.log('inner')
})
const outer: T.Task<void> = () => new Promise(res => {
  console.log('outer')
})
const innerFirst: T.Task<T.Task<void>> = pipe(
  outer,
  T.map(() => inner),
)
// output:
// inner
// outer
```

Once again, the behavior of Task is more consistent than the behavior of Promise. We'll discuss eager vs. lazy evaluation in the next article, TaskEither vs Fluture.

# Conclusion

`Promise` is powerful. It has made javascript into a first class language for asynchronous programming. I hope Domenic Denicola's legacy is his tremendous 'Promises/A+' spec, and not his [infamous github comment](https://github.com/promises-aplus/promises-spec/issues/94#issuecomment-16176966) criticising typed functional programming (the javascript fp library 'fantasy-land' was [named after it](https://github.com/promises-aplus/promises-spec/issues/94#issuecomment-16274090)).

Though I disagree with his statement, I understand where he was coming from. He was carrying the weight of dozens of proposals and the future of asynchronous programming - as javascript becomes more popular outside of the web ([nodejs](https://nodejs.org/en/), [react native](https://reactnative.dev/), [electron](https://www.electronjs.org/), [ink](https://github.com/vadimdemedes/ink), etc), it becomes clearer that the success of 'Promises/A+' had staggering implications. He must have felt that one wrong move could bring it all toppling down.

Not to give all the credit to Denicola - the idea is 45 years old, and it took many people many ideas and iterations to get to the point of 'Promises/A+'. I just would have felt wrong writing an article about `Promise` from a functional perspective without mentioning that github thread. If not for the aggressive and cyclical nature of the debate (on both sides), would recommend reading it - it's entirely about the practicality of functional programming & category theory. There's also a similar thread about `Promise.resolve` [here](https://github.com/promises-aplus/constructor-spec/issues/24) - read at your own peril.

Needless to say, as great as `Promise` is, `TaskEither` is even better. It resolves many the pitfalls outlined above, and adds a ton of functionality. With its laziness, referential transparency, type-safety, and advanced yet simple control flow, `TaskEither` is the culmination of the best asynchronous programming techniques available.

[^1]: Some people dislike the burrito metaphor - they correctly assert that it only describes a few monads, and only leads to more confusion later when introduced to more. Here are a couple of paradigmatic tweets ([1](https://twitter.com/impurepics/status/1283660072380502016/photo/1), [2](https://twitter.com/YuriyBogomolov/status/1283237296402243585)).

  However, the paper [What we Talk About When we Talk About Monads](http://tomasp.net/academic/papers/monads/monads-programming.pdf) posits that such metaphors are necessary for complete understanding of the concept.