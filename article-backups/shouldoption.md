![Definitely Option](https://img.cdandlp.com/2017/02/imgL/3062722574.jpg)

# tl;dr

`Option` is more powerful than [nullable](https://www.typescriptlang.org/docs/handbook/advanced-types.html#nullable-types) but can be cumbersome to work with if you aren’t using it consistently. New apps should use `Option` everywhere but it can sometimes be a hassle to mix it into existing apps.

# Contents

- [What is Option?](#what-is-option)
- [The Problem](#the-problem)
- [What Option does well](#what-option-does-well)
- [Trying to get an intuition](#trying-to-get-an-intuition)
- [Final Thoughts](#final-thoughts)
- [Appendix: Uses for Option](#appendix-uses-for-option)
  - [Converting to and from Either](#converting-to-and-from-either)
  - [Safe Array Operations](#safe-array-operations)
  - [Array of Option](#array-of-option)
  - [Tuple of Option](#tuple-of-option)
  - [Safe Record Operations](#safe-record-operations)
  - [Chaining And Using Several Optional Values In Sequence](#chaining-and-using-several-optional-values-in-sequence)
  - [Accessing and Modifying Deeply Nested Data](#accessing-and-modifying-deeply-nested-data)

# What is Option?

If you aren't sure, here are links to simple lessons that I like:
  - [pipe](https://dev.to/ryanleecode/practical-guide-to-fp-ts-pipe-and-flow-4e9n) (good to understand this before diving into Option)
  - [Option](https://dev.to/ryanleecode/practical-guide-to-fp-ts-option-map-flatten-chain-6d5)

# The Problem

Nullables are simple. (For this article, I'll be using the term 'nullable' to mean ['union type with undefined'](https://www.typescriptlang.org/docs/handbook/advanced-types.html#nullable-types))

```ts
const multiplyNullableByTwo = (
  num: number | undefined
): number | undefined => num ? num * 2 : undefined
```

`Option` is even simpler. 

```ts
import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/pipeable'
const multiplyOptionalByTwo: (
  num: O.Option<number>
) => O.Option<number> = O.map(n => n * 2)
```

But what if we're adding fp-ts to an app that already uses lots of nullables?

```ts
const multiplyOptionalByTwo: (
  num: number | undefined
) => O.Option<number> = ????
```

We have to upconvert using `O.fromNullable`

```ts
import { flow } from 'fp-ts/function'
const multiplyNullableByTwo: (
  num: number | undefined
) => O.Option<number> = flow(
  O.fromNullable,
  O.map(n => n * 2)
)
```

But should we return an `Option`? It makes `multiplyNullableByTwo` less interoperable with the existing code that uses nullables. It might be confusing for other devs who don't know `fp-ts`, or incoming devs who aren't sure why `Option` is used in some places and nullable elsewhere.

Should we convert back?

```ts
const multiplyNullableByTwo: (
  num: number | undefined
) => number | undefined = flow(
  O.fromNullable,
  O.map(n => n * 2),
  O.toUndefined,
)
```

In this case, it's definitely not worth the hassle. We should just use the nullable approach from the beginning of this section.

But where's the line? When is `Option` more appropriate than nullable?

# What Option does well

`if` statements are are nowadays considered [brittle and poorly legible](https://degoes.net/articles/destroy-all-ifs), and `Option` helps simplify control flow.

Let's say you want to write a function called `greet` that turns certain authors' names lowercase, and refers to everyone else by their last name. The following has already been implemented (Note that `lastName` returns a nullable):

```ts
const lowercase = (a: string): string => a.toLowerCase()
const isAuthor = (a: string): boolean => lowercase(a).includes('bell hooks') || lowercase(a).includes('pattrice jones')
const lastName = (a: string): string | undefined => a.split(' ').length > 1 ? a.split(' ')[1] : undefined
```

Here is the traditional implementation using plain nullables:

```ts
const greet = (name: string | undefined): string => {
  let modifiedName: string | undefined = undefined
  if (name) {
    if (isAuthor(name)) {
      modifiedName = lowercase(name)
    } else {
      const last = lastName(name)
      if (last) {
        modifiedName = last
      }
    }
  }
  if (modifiedName) {
    return `Hello ${modifiedName}`
  }
  return 'Greetings!'
}
```

This version has mutable state (which we normally [want to avoid](https://www.typescriptlang.org/docs/handbook/variable-declarations.html#let-vs-const)), convoluted [control flow](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling), and [multiple exit points](https://hackerchick.com/religious-war-48293-single-vs-multiple/), which are controversial at best.

Here's the same function implemented with `Option`:

```ts
const greet = (name: string | undefined): string => pipe(
  O.fromNullable(name),
  O.chain(O.fromPredicate(isAuthor)),
  O.map(lowercase),
  O.alt(() => pipe(
    O.fromNullable(name),
    O.chain(flow(
      lastName,
      O.fromNullable,
    )),
  )),
  O.map(n => `Hello ${n}`),
  O.getOrElse(() => 'Greetings!'),
)
```

This version is shorter even including the extra conversions with `fromNullable`.
 
The `Option` version is easier to read. Our `Option` operations give us clues to what's going on:
  - `fromPredicate`: `isAuthor` is a predicate
  - `alt`: `lastName` is applied as an alternative to `lowercase`
  - `chain`: `lastName` might fail
  - `getOrElse`: return 'Greetings!' if anything goes wrong

It's an example of [expression-oriented programming](https://alvinalexander.com/scala/fp-book/note-about-expression-oriented-programming/). This means that every line of code has a return value as opposed to executing a side effect. This mitigates information loss and discourages unnecessary side effects.

We could do something like this:

```ts
const greet = (name: string | undefined): string => {
  const modifiedName = name
    ? isAuthor(name)
      ? lowercase(name)
      : lastName(name)
        ? lastName(name)
        : undefined
    : undefined
  if (modifiedName) {
    return `Hello ${modifiedName}`
  }
  return 'Greetings'
}
```

This approach, while shortest, is probably the least legible of the three. Related cases are spread far apart, it's not obvious why `lastName` is called twice, and nested ternaries are often [disabled by eslint](https://eslint.org/docs/rules/no-nested-ternary) anyway.

This article's [appendix](#appendix-uses-for-option) details many useful things that `Option` can do better than nullable.

# Trying to get an intuition

Ok, we get it, `Option` is more powerful than nullable. But that doesn't change the fact that nullable is a very common pattern and can often lead to simpler, shorter solutions.

How can I know when it will be worth the hassle?  Should I store `Option`s in my data model? Even if my old code still uses nullable all over the place?

This is tricky to think about. I think this question gets at a fundamental paradox about functional programming generally: simple problems become hard and hard problems become simple. Maybe in this case, it's better framed as simple problems becoming slightly awkward and not being sure whether your simple problem will eventually become a hard problem that we can turn into an simple problem.

Functional programming represents an intersection of academic research and practical engineering. What's exciting about `fp-ts` is that it's the functional Typescript library that has made the fewest compromises for engineering's sake. This gives it power, but also rigidity. In this regard, fp-ts is [easy, but not simple](https://www.infoq.com/presentations/Simple-Made-Easy/) (as defined by Rich Hickey, the author of Clojure).

[Maciej Sikora's](https://dev.to/macsikora) wonderful article [Maybe just Nullable?](https://dev.to/macsikora/maybe-just-nullable-10ci) posits that `Option` should be avoided unless the entire application is implemented using functional techniques.

For me, within an application it's often worth the small amount of pain to up-convert into `Option`. Hopefully you can use the above example and the [appendix](#appendix-uses-for-option) below as tools to predict whether your data would benefit from being represented as `Option` in the long run.

However, if you're exposing an interface that many other developers will use, and many of them won't be using `fp-ts`, it's probably best to save them the hassle and simply expose `undefined`. This could be an npm module, or just a project where all the devs aren't entirely comfortable with fp concepts.

# Final Thoughts

In an impure language like Typescript, your code will never be fully functional. There are necessarily shades of fp gray along the Typescript spectrum. Choosing to use React pushes your project [towards the functional side](https://lispcast.com/is-react-functional-programming), or at least more so than choosing [Angular](https://fireship.io/lessons/object-oriented-programming-with-typescript/) or [Vue](https://itnext.io/https-medium-com-manuustenko-how-to-avoid-solid-principles-violations-in-vue-js-application-1121a0df6197). Choosing lodash shifts slightly further, although even vanilla es6 has taken great inspiration from fp paradigms (by way of lodash and underscore). Maybe you'll go crazy and wrap all your side effects in IO for referential transparency (or maybe that's going sane!)

Adding `fp-ts` to a project will make waves. It can be particular and finicky, more so than a library like `lodash` which can integrate more seamlessly. Like any restriction, the benefit is more power.

Ultimately, it's up to you how functional you want your code to be. It can be difficult to convince your team to make the switch, and migrating an entire existing project can be beyond reach. In this author's opinion, even in small doses, it's worth the inconvenience, but in any case hopefully this article gives you enough context to make informed decisions.

If you have a specific case where you are still having trouble deciding, please leave a comment or [tweet at me](https://twitter.com/typesafeFE) about it - sometimes these are difficult questions and I'd love to have longer conversations about them!

# Appendix: Uses for Option

## Converting to and from Either

Can be useful if error messages are unimportant, or if decide you want to add one later on:

```ts
import * as E from 'fp-ts/Either'
const parseIntResult: E.Either<string, number> = E.right(3)

const discardErrorMessage: O.Option<number> = O.fromEither(parseIntResult)

const addErrorMessage: E.Either<string, number> = pipe(
  discardErrorMessage,
  E.fromOption(() => 'could not parse to number'),
)
```

## Safe Array Operations

This [PR to Typescript was closed](https://github.com/microsoft/TypeScript/issues/11122), so this is dangerous:

```ts
const names: string[] = ['anthony', 'gabriele']
const unsafeThirdName: string = names[2]
```

Unfortunately, this won't even crash at runtime. `unsafeThirdName` will merely be set to 'undefined' even though the type doesn't reflect that. It will run as though nothing is wrong until `unsafeThirdName` is used.

`Option` is safer.

```ts
import * as A from 'fp-ts/Array'

const safeThirdName: O.Option<string> = pipe(
  names,
  A.lookup(2)
)
```

There are many safe `Array` functions that take advantage of `Option`:
  - [`A.head`](https://github.com/gcanti/fp-ts/blob/a5f06e7172eab0fe36ea72ae19263e2d78cc3200/test/Array.ts#L394)
  - [`A.findFirst`](https://github.com/gcanti/fp-ts/blob/a5f06e7172eab0fe36ea72ae19263e2d78cc3200/test/Array.ts#L471)
  - [`A.insertAt`](https://github.com/gcanti/fp-ts/blob/a5f06e7172eab0fe36ea72ae19263e2d78cc3200/test/Array.ts#L567)
  - [and many more](https://github.com/gcanti/fp-ts/blob/a5f06e7172eab0fe36ea72ae19263e2d78cc3200/test/Option.ts#L145)

(Edit: Good news! [Ryan Lee](https://dev.to/ryanleecode) pointed out in the comments that Typescript 4.1 will fix this issue by providing a new compiler flag, which can be set on the command line like this: `tsc --noUncheckedIndexedAccess` or by setting `"noUncheckedIndexedAccess": true` in the `compilerOptions` of your `tsconfig.json` (thanks Ryan!). At the time of writing (16/9/2020), it hasn't been folded into a stable build of Typescript yet, but it is in the latest nightly build. You can learn more about the flag in its PR [here](https://github.com/microsoft/TypeScript/pull/39560))

(This leaves us with a bit less justification for using `Option` in a project where `fp-ts` usage is not ubiquitous, since `A.lookup` and `R.lookup` are now actually slightly more cumbersome to use than the new nullable syntax.)

(However, this assumes that your Typescript version is greater than version 4.1 and that you have `noUncheckedIndexedAccess` enabled. We will see if and when those things get folded into common use with tools like [`create-react-app`](https://create-react-app.dev/docs/adding-typescript/) which is still currently using version 3.7.5 (nearly a year old), [`ng create`](https://angular.io/tutorial/toh-pt0) which uses 3.8.3, etc.)

## Array of Option

Let's say we have an array of optional names:

```ts
const names: O.Option<string>[] = [O.some('anthony'), O.none, O.some('gabriele')]
```

If we want to remove all empty values, we can use:

```ts
const existingNames: Array<string> = pipe(
  names,
  A.compact
)

// existingNames = ['anthony', 'gabriele']
```

To ensure the array contains no empty values, we can use:

```ts
const allNamesFailure: O.Option<Array<string>> = pipe(
  names,
  A.sequence(O.option)
)
// allNamesFailure = O.none

const allNamesSuccess: O.Option<Array<string>> = pipe(
  [O.some('anthony'), O.some('gabriele')],
  A.sequence(O.option)
)
// allNamesSuccess = O.some(['anthony', 'gabriele'])
```

`sequence` is used to 'flip' nested generic types inside out - here, we have gone from `Array<O.Option<string>>` to `O.Option<Array<string>>`

## Tuple of Option

If we want to ensure a tuple has no empty values, we can't use `A.sequence`, since the internal types can be different from each other:

```ts
const nameAndAge: [O.Option<string>, O.Option<number>] = [O.some('anthony'), O.some(26)]

const bothNameAndAge: O.Option<[string, number]> = pipe(
  nameAndAge,
  A.sequence(O.option),
)
// error: Type '[Option<string>, Option<number>]' is not assignable to type 'Option<string>[]'.
```

You can use `sequenceT` in this case:

```ts
import { sequenceT } from 'fp-ts/Apply'
const printSelf: string = pipe(
  sequenceT(O.option)(...nameAndAge),
  O.map(
    ([name, age]: [string, number]) =>
      `in five years, ${name} will be ${age + 5}`
  ),
  O.getOrElse(() => 'missing name or age'),
)
```

## Safe Record Operations

There are similar functions for `Record` as for `Array`:

```ts
import * as R from 'fp-ts/Record'

const block: Record<string, number> = {
  buildings: 5,
  streets: 4
}

const unsafeNumBuildings: number = block.buildings

const safeNumBuildings: O.Option<number> = pipe(
  block,
  R.lookup('buildings')
)

const ingredients: Record<string, O.Option<number>> = {
  onions: O.some(2),
  peppers: O.none,
  eggs: O.some(3),
}

const whateverOmlette: Record<string, number> = pipe(
  ingredients,
  R.compact,
)

const westernOmlette: O.Option<Record<string, number>> = pipe(
  ingredients,
  R.sequence(O.option),
)
```

## Chaining And Using Several Optional Values In Sequence

If you find yourself with the deeply nested `chain` of doom:

```ts
const addFour: number = pipe(
  O.some(6),
  O.chain(first => pipe(
    O.some(1),
    O.chain(second => pipe(
      O.some(first + 7),
      O.chain(third => pipe(
        O.some(4),
        O.map(fourth => first + second + third + fourth),
      ))
    )),
  )),
)
```

You can approximate [Haskell's `Do` notation](https://en.wikibooks.org/wiki/Haskell/do_notation) like this:

```ts
const addFour: number = pipe(
  O.some(6),
  O.bindTo('first'),
  O.bind('second', () => O.some(1)),
  O.bind('third', ({ first }) => O.some(first + 7)),
  O.bind('fourth', () => O.some(4))
  O.map(({ first, second, third, fourth }) => first + second + third + fourth)
)
```

Much cleaner!

## Accessing and Modifying Deeply Nested Data

`Option` can help you easily access & modify deeply nested data using [`monocle-ts`](https://github.com/gcanti/monocle-ts#experimental-modules):

```ts
import * as Op from 'monocle-ts/lib/Optional'

interface Employee {
  name: string
  company: {
    name: string
    address: {
      city: string
      street: O.Option<{
        num: number
        name: string
      }>
    }
  }
}

const companyStreetName: Op.Optional<Employee, string> = pipe(
  Op.id<Employee>(),
  Op.prop('company'),
  Op.prop('address'),
  Op.prop('street'),
  Op.some,
  Op.prop('name')
)

const employee: Employee = ...
const employeeCompanyStreetName: O.Option<string> =
  companyStreetName.getOption(employee)
const employeeAfterMove: Employee = pipe(
  employee,
  companyStreetName.set('New Street Name')
)
```

`getOption` is `Option`'s version of nullable's [optional chaining](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#optional-chaining) (which is a confusing name in this context because nullable is not `Option`), but `set` has no such equivalent.