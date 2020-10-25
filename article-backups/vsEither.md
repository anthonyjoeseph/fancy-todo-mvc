![Love Everyone - No Exceptions](https://ih1.redbubble.net/image.414124884.7285/st,small,845x845-pad,1000x1000,f8f8f8.u3.jpg)

# tl;dr

`Either` solves the problems presented by Exception Handling by adding power and flexibility.

# Contents

- [Why use Either](#why-use-either)
- [Unchecked Exceptions](#unchecked-exceptions)
  * [`Either` Provides Types and Compile Time Safety](#-either--provides-types-and-compile-time-safety)
- [Checked Exceptions](#checked-exceptions)
- [Unwanted Information](#unwanted-information)
  * [Either Can Eject Unneeded Info](#either-can-eject-unneeded-info)
- [Similarity to goto](#similarity-to-goto)
  * [Expression Oriented Control Flow](#expression-oriented-control-flow)
- [Difficulty with Callbacks](#difficulty-with-callbacks)
  * [Streams](#streams)
  * [Progression](#progression)
- [Other Benefits of Either](#other-benefits-of-either)
  * [Compositionality](#compositionality)
  * [Validations](#validations)
- [Either Drawbacks and Pitfalls](#either-drawbacks-and-pitfalls)
  * [Leaky abstraction](#leaky-abstraction)
  * [Pokemon Anti Pattern](#pokemon-anti-pattern)
  * ['Stringly-typed error handling'](#-stringly-typed-error-handling-)
    + [Solution: Union Types](#solution--union-types)
- [Conclusion](#conclusion)

# Why use Either

Why does `Task` represent both its failure and success cases in data with `Either`? It seems a bit arbitrary to invent a data type that just represents one thing or another. How did we get here?

Before `Either` became a common pattern, errors were mainly managed with exception handling. The flaws inherent to exception handling are well documented. In my research, I found that many critical articles pointed to the same few problems.

I've compiled code samples illustrating these problems and alternative code samples showing how `Either` solves them.

# Unchecked Exceptions

Javascript implements exception handling. You've probably seen this kind of thing (adapted from [this Joe Fallon article](https://joefallon.net/2018/09/typescript-try-catch-finally-and-custom-errors/))

```ts
let resource: ExampleResource | undefined = undefined;
try {
  resource = new ExampleResource();
  const opened: number = resource.open();
  // use the resource...
} catch (e: any) {
  if (e instanceof Error) {
    // handle error if possible
  } else {
    throw e;
  }
} finally {
  if (resource) {
    resource.close();
  }
}
```

Javascript exceptions are unchecked. This means that the errors are of the `any` type (something we normally [want to avoid](https://43081j.com/2019/02/typescript-avoid-using-any)). It also means that exception handling is optional. It's perfectly legal to ignore the possibility of an exception:

```ts
const resource = new ExampleResource();
resource.open();
// use the resource...
resource.close();
```

This is a problem. Users of `ExampleResource` have no way of knowing whether it could throw an exception other than reading its documentation (assuming it has documentation). They could be in for a surprise runtime error.

## `Either` Provides Types and Compile Time Safety

Here's the same problem, solved with `Either`

```ts
interface ExampleResource {
  open: () => E.Either<string, number>
  close: () => void
}

const getExampleResource = (): E.Either<string, ExampleResource> => ...

const handleResource = (): void => pipe(
  getExampleResource(),
  E.chain((resource: ExampleResource) => {
    const result: E.Either<string, number> = pipe(
      resource.open(),
      E.map((opened: number) => {
        // use the resource ...
      })
    )
    resource.close()
    return result
  }),
  E.fold(
    console.error,
    console.log,
  ),
)
```

The error type is preserved in the type signature `Either<string, number>` You can see at compile time exactly what can go wrong. No more `any` types. You are encouraged to deal with the possible errors by the data structure of `Either`.

# Checked Exceptions

Languages that were designed before `Either` became popular tried to solve this problem by using checked exceptions. We'll use Java for these examples since it was the first mainstream language to implement checked exceptions and remains the canonical example of them.

If a method throws an error, you're forced at compile time to surround it in a try/catch block, or to propagate it yourself.

```java
public void useResource() {
  ExampleResource resource;
  try {
    resource = new ExampleResource();
    resource.open();
    // use the resource...
  } catch (e: IOException) {
     // handle error
  } finally {
    if (resource != null) {
      resource.close();
    }
  }
}
```

Neglecting an exception is a compile time error:

```java
public void useResource() {
  // Unhandled exception: java.io.IOException
  ExampleResource resource = new ExampleResource();
}
```

If `useResource` shouldn't handle the exception, you can choose to propagate it instead using `throws`

```java
public void useResource() throws IOException {
  ExampleResource resource = new ExampleResource();
}
```

Checked exceptions are a step in the right direction. They give exceptions type inference and compile-time safety.

However, this approach has a few drawbacks.

# Unwanted Information

Although checked exceptions have the advantage of type-safety, often that information is unwanted boilerplate.

```java
catch (IOException e) {
  // 'e' is ignored
  Dialog.alert("Crash when opening resource")
}
```

This can actually be harmful, as in the case where a low-level method throws a new exception, causing a chain of callers that are now broken at compile time. (Image taken from [Checked Exceptions are Evil](https://phauer.com/2015/checked-exceptions-are-evil/#no-recovery-possible-at-all))

![Broken chain of methods](https://phauer.com/blog/2015/0328-checked-exceptions-are-evil/checked-exceptions-rethrow-problem1.png)

Bill Venners asked Anders Hejlsberg (who would go on to [co--found Typescript](https://www.cleverism.com/skills-and-tools/typescript/)) about this problem in [an interview for artima.com](https://www.artima.com/intv/handcuffs.html):

> Venners: But aren't you breaking their code [by throwing a new exception] anyway?

> Hejlsberg: ...No, because in a lot of cases, people don't care. They're not going to handle any of these exceptions. There's a bottom level exception handler around their message loop. That handler is just going to bring up a dialog that says what went wrong and continue.

> The programmers protect their code by writing try finally's everywhere, so they'll back out correctly if an exception occurs ... You make sure you protect yourself all the way out by deallocating any resources you've grabbed, and so forth.

> ...You don't want a program where in 100 different places you handle exceptions and pop up error dialogs. What if you want to change the way you put up that dialog box? That's just terrible. The exception handling should be centralized, and you should just protect yourself as the exceptions propagate out to the handler.

## Either Can Eject Unneeded Info

This problem is easily solved by converting `Either` into `Option`

```ts
const withError: E.Either<string, number> = ...
const errorDoesntMatter: O.Option<number> = pipe(
  withError,
  O.fromEither,
)
```

# Similarity to goto

Cunningham also notes in [Don't Use Exceptions for Control Flow](https://web.archive.org/web/20140430044213/http://c2.com/cgi-bin/wiki?DontUseExceptionsForFlowControl) that they can be used as a kind of goto statement (goto is [considered harmful](https://homepages.cwi.nl/~storm/teaching/reader/Dijkstra68.pdf)). Here is his example:

```java
public void search(TreeNode node, Object data) throws ResultException {
  if (node.data.equals(data)) {
    throw new ResultException(node);
  } else {
    search(node.leftChild, data);
    search(node.rightChild, data);
  }
}
```

> The cute trick here is that the exception will break out of the recursion in one step no matter how deep it has got...This makes it harder for programmers to read.

## Expression Oriented Control Flow

Since in the above example exception is actually being used to represent optionality, in this case it's actually best replaced by `Option`

```ts
import * as O from 'fp-ts/Option'
import * as E from 'fp-ts/Either'

interface TreeNode<D> {
  data: D
  leftChild: O.Option<TreeNode<D>>
  rightChild: O.Option<TreeNode<D>>
}
const search = <D>(data: D) => (node: TreeNode<D>): O.Option<TreeNode<D>> => pipe(
  node,
  O.fromPredicate(node => node.data === data),
  O.alt(() => pipe(
    node.leftChild,
    O.chain(search(data)),
  )),
  O.alt(() => pipe(
    node.rightChild,
    O.chain(search(data)),
  )),
)

// we can convert `Option` into `Either` (if we want to)
const searchEither = <D>(data: D) => (node: TreeNode<D>): E.Either<string, TreeNode<D>> => pipe(
  search(data)(node),
  E.fromOption(() => 'data not found'),
)
```

This is an example of expression-oriented programming, as opposed to the Java example which is statement-oriented.

According to [Alvin Alexander](https://alvinalexander.com/scala/fp-book/note-about-expression-oriented-programming/):

> Statements do not return results and are executed solely for their side effects, while expressions always return a result and often do not have side effects at all.

This makes the code easier to read and to reason about, because each operation is labelled and does exactly what it seems like it does.

Even though this code is a [one-liner](https://en.wikipedia.org/wiki/One-liner_program), reading through it we get a sense of things happening one after another. In this sense, `alt` and `chain` can be thought of as [programmable semicolons](https://samgrayson.me/2019-08-06-monads-as-a-programming-pattern/#control-flow): they are sequential in nature.

# Difficulty with Callbacks

Here is an example adapted from Ward Cunningham's [The Problem with Checked Exceptions](https://wiki.c2.com/?TheProblemWithCheckedExceptions)

```java
interface Procedure { public void call(); }
abstract class Context {
  public static callWithContext(Procedure proc);
}
...
Context.callWithContext(new Procedure () {
  public void call() {
    InputStream is = ...
    is.read(); // what if `read` throws an exception?
  }
});
```

How should we handle this? We can't throw the error because `Context` doesn't know how to handle it. We could put a `try`/`catch` block in our implementation of `call`, but this often isn't ideal - exceptions are often handled similarly across many different situations (e.g. an error dialog box) so this approach could lead to duplicate code. 

[Duncan McGregor notes](http://oneeyedmen.com/failure-is-not-an-option-part-4.html) that Java-style checked exceptions don't integrate well with inline ([lambda](https://www.baeldung.com/java-lambda-exceptions)) or higher-order functions. The previous example is essentially a different statement of the same problem.

## Streams

A callback like this can often be replaced with a data structure called a Stream. Two common kinds of stream in Typescript are [generators](https://modernweb.com/replacing-callbacks-with-es6-generators/) and [rxjs Observables](https://rxjs-dev.firebaseapp.com/guide/observable)[^1]. Here, we'll use `Observable`.

The advantage of streams is that they compose together easily. Used in confluence with `Either`, this solves our above problem - we're able to compose together several streams of error-prone operations, DRY-ly handling all errors in the same place.

```ts
import { pipe } from 'fp-ts/pipeable'
import * as E from 'fp-ts/Either'
import * as r from 'rxjs'
import * as ro from 'rxjs/operators'

const numberOutput: O.Observable<Either<string, number>> = new r.Observable((subscriber) => {
  Context.callWithContext(() => {
    const err: E.Either<string, number> = readNumber()
    subscriber.next(err)
  })
})
const otherOutput: O.Observable<Either<string, number>> = ...

// unified errors & successes
const combineStreams: r.Observable<void> = pipe(
  r.merge(numberOutput, otherOutput),
  ro.map(E.fold(
    console.error,
    console.log
  )),
)
```

## Progression

The oversimplified history of exception handling went like this (modified from from Duncan McGregor's [Failure is not an Option](http://oneeyedmen.com/failure-is-not-an-option-part-4.html)):

  1. Early APIs returned error codes or set global error flags, but it was easy to forget to check these.
  2. [[`C++`-style](https://www.stroustrup.com/whatis.pdf)] Exceptions were introduced [debatably in [Algol 68](https://stackoverflow.com/a/1457978/615493)] to force explicit error handling, but it was still hard to know if a function could fail in practice.
  3. Checked exceptions were introduced [in [Java](https://en.wikipedia.org/wiki/Exception_handling#Static_checking_of_exceptions)] to make expected failure conditions more explicit.
  4. Checked exceptions [have problems], go back 2 spaces [Unchecked exceptions in [C# (kinda)](https://www.tutorialspoint.com/Checked-vs-Unchecked-Exceptions-in-Chash), [Ruby, Python](https://www.yegor256.com/2015/07/28/checked-vs-unchecked-exceptions.html), [Scala](https://nrinaudo.github.io/scala-best-practices/referential_transparency/avoid_throwing_exceptions.html), [Kotlin](https://kotlinlang.org/docs/reference/exceptions.html#checked-exceptions), [Haskell](https://stackoverflow.com/a/56298959/615493)].

# Other Benefits of Either

## Compositionality

Not all errors come from the same place - for example, there are validation errors that come from email address input, selecting an invalid date for a person's birthday, or of course, asynchronous failures. `Either` composes quite nicely no matter where the error came from.

```ts

const asyncOp: TE.TaskEither<string, Response> = TE.tryCatch(
  fetch('http://google.com'),
  E.toError
)
const syncOp: E.Either<string, number> = validateEmail(...)

const output = pipe(
  asyncOp,
  T.map(resp => pipe(
    sequenceT(E.either)(
      resp,
      syncOp,
    ),
    E.fold(
      console.error,
      ([resp, validated]: [Response, string]) => {
        // use values safely
      }
    ),
  )),
)

```

## Validations

`Either` only represents one kind of control flow - a series of operations that [short-circuit](https://www.interviewcake.com/concept/java/short-circuit-evaluation) when any one of them fails. What if we want to continue past an individual failure and collect many possible errors?

Validation is the solution - read more about it [here](https://dev.to/gcanti/getting-started-with-fp-ts-either-vs-validation-5eja)

# Either Drawbacks and Pitfalls

## Leaky abstraction

In his wonderful article on F#, [You're better off using Exceptions](https://eiriktsarpalis.wordpress.com/2017/02/19/youre-better-off-using-exceptions/), Eirik Tsarpalis argues that `Either` is a leaky abstraction in a language with unchecked exceptions. Since any operation could fail at any time, we can never ensure full coverage.

Indeed, even a rigid language like Haskell that boasts of [referential transparency](https://wiki.haskell.org/Referential_transparency) uses [unchecked exceptions](https://www.fpcomplete.com/haskell/tutorial/exceptions/). They are an ever-present threat.

And necessarily so. At their most useful, exceptions represent errors that are unexpected, like division by zero or array index out of bounds. Well written code avoids these cases, but of course they are often possible and must be accounted for.

## Pokemon Anti Pattern

Tsarpalis writes about this in context of [the pokemon anti-pattern](https://wiki.c2.com/?PokemonExceptionHandling), named after the catchphrase "Gotta Catch 'em All"

```ts
const simpleArithmetic: (nums: number[]) => number = ...

// since any operation could fail, everything becomes an `Either`
const avg: E.Either<string, number> = E.tryCatch(
  () => simpleArithmetic(nums),
  E.toError
) // gotta catch em all!
```

This is a problem, since it becomes increasingly difficult to handle errors properly when everything is a potential error.

## 'Stringly-typed error handling'

Tsarpalis mentions another common anti-pattern - "stringly typed" error handling, a pun on "strongly typed". The pattern is every error sharing the same type: `string`. This is a problem because differentiating between different kinds of errors based on string comparison becomes messy and fragile.

```ts
const operation: E.Either<string, number> = ...
const output = pipe(
  operation,
  E.mapLeft((error: string) => {
    if (error.startsWith('Cannot read property')) {
      console.error('Parse error')
    } else {
      console.error('Other error')
    }
  })
)
```

In this example, we're relying on our error to start with the exactly correct string. This is messy because different errors might share this attribute, and it's fragile because there might be typos. We also have no compile time guarantees that every possible error has been handled.

The examples in this article so far have used this anti-pattern only for the sake of simplicity. I don't recommend using `string` to represent errors

Using the `Error` type [provided by Typescript](https://github.com/microsoft/TypeScript/blob/2428ade1a91248e847f3e1561e31a9426650efee/src/lib/es5.d.ts#L952) leads to the same problems, since often the only relevant information is stored in `message`, a `string`. This is of course also a problem with exception handling, except it's worse because we have an `any` type instead of `string`.

You can solve all of these problems by representing your errors with union types instead.

### Solution: Union Types

With a union type, you decide ahead of time which errors you care about, and you're able to easily simulate a [pattern match](https://stackoverflow.com/questions/2502354/what-is-pattern-matching-in-functional-languages) using a `switch` statement. 

```ts
const enum ErrorType {
  Parse,
  Other,
}

const operation: E.Either<ErrorType, number> = ...
const output = pipe(
  operation,
  E.mapLeft((error: ErrorType) => {
    switch (error) {
      case ErrorType.Parse:
        console.error('Parse error')
        break;
      case ErrorType.Other:
        console.error('Other error')
        break;
    }
  })
)
```

This way, we're able to choose exactly what granularity we want to handle errors with, and hold ourselves to that later. This is better than stringly-typed errors because we're able to easily differentiate between errors at compile time. If we use a sum type library like `@morphic-ts/adt`, we get a more strict pattern match with exhaustiveness checking to ensure that we've handled every case.

I've written more extensively about about using sum types and `@morphic-ts/adt` here, and about the difference between union types and sum types here.

# Conclusion

Phil Hauer makes the point in [Checked Exceptions are Evil](https://phauer.com/2015/checked-exceptions-are-evil/#no-recovery-possible-at-all) that if we're just logging an error and exiting, it's actually more informative to fail at runtime because we have the added benefit of the printed call stack.

Sometimes there's wisdom in forgoing a more comprehensive yet flawed solution. However, rather than throwing the baby out with the bathwater, `Either` solves all of the specific problems I could find for exceptions, both unchecked and checked.

I would argue that the advantages of `Either` outweigh the pain of uncertainty. [Every non-trivial abstraction leaks](https://www.joelonsoftware.com/2002/11/11/the-law-of-leaky-abstractions/), and I think `Either` is still better than its alternatives.

This is a common refrain when adopting functional paradigms. Since complete purity is basically unattainable, past what point is it worth striving for anyway? In the case of `Either`, I think almost always.

However, since they are by definition a compile-time solution they cannot take the place of unexpected runtime exception handling. Hopefully the arguments listed above can help explain the resurgence of unchecked exception handling and its benefits.

[^1]: rxjs is generally used for pushing changes, while generators are used for pulling them. Generators are better for handling backpressure. [source](https://stackoverflow.com/a/45294082/615493)