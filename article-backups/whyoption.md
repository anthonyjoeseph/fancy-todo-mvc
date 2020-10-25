![Removing the label](https://static1.squarespace.com/static/54093b42e4b06b763c30cb28/t/5417ac47e4b0d2ecae1ee692/1410837577087/BeerBottles_091514_04.jpg)

# tl;dr

`Option` contains more data when nested than traditional [nullable](https://www.typescriptlang.org/docs/handbook/advanced-types.html#nullable-types) values do.

# Contents

- [The problem](#the-problem)
- [Something `Option` can do that `Nullable` Can't](#something--option--can-do-that--nullable--can-t)
  * [`undefined` can't nest](#-undefined--can-t-nest)
  * [`Option` saves the day!](#-option--saves-the-day-)
  * [Metadata and Data: Sum Types vs Union Typs](#metadata-and-data--sum-types-vs-union-typs)
- [Category Theory](#category-theory)
- [Conclusion](#conclusion)

# The problem

`Option` is nice - it's got a monad instance and pipeable helper functions and all that - but it can be inconvenient when you have to also work with `null` or `undefined`.

With the `Array` and `Record` helper functions & typeclass instances, I'm able to simply input and output standard Typescript Array and Record types:

```ts
import * as A from 'fp-ts/Array'
import * as R from 'fp-ts/Record'
import { pipe } from 'fp-ts/pipeable'

const arr: number[] = pipe(
  [1, 2, 3],
  A.map(n => n * 2),
)
const rec: Record<string, number> = pipe(
  {a: 1, b: 2, c: 3},
  R.map(n => n * 2),
)
```

`Option` represents a similarly common pattern ([nullables](https://www.typescriptlang.org/docs/handbook/advanced-types.html#nullable-types)), but I have to convert nullable values using `O.fromNullable` and back again using `O.toUndefined`:

```ts
import * as O from 'fp-ts/Option'
const nullablenum: number | undefined = ...
const opt: number | undefined = pipe(
  nullablenum,
  O.fromNullable,
  O.map(n => n * 2),
  O.toUndefined
)
```

If you're interested in whether to use 'Nullable' or `Option`, check out my companion article, [Should I Use fp-ts Option](https://dev.to/anthonyjoeseph/should-i-use-fp-ts-option-28ed)

But why do we have to choose? Why isn't `Option` just defined as `type Option<A> = A | undefined`? It's trivial to implement a monad instance for that type:

```ts
type Option<A> = A | undefined
const of = <A>(a: A): Option<A> => a
const chain = <A, B>(f: (a: A) => Option<B>) => (b: Option<A>): Option<B> => b ? f(b) : undefined
```

This instance passes all the [monad laws](https://wiki.haskell.org/Monad_laws)

```ts
const value: number = 1
const f = (x: number) => of(x * 2)
const g = (x: number) => of(x + 6)
const leftIdentity = pipe(value, of, chain(f)) === f(value)
const rightIdentity = pipe(value, of, chain(of)) === pipe(value, of)
const associativity = pipe(value, of, chain(f), chain(g)) === pipe(value, of, chain(flow(f, chain(g))))
```

Which also holds true if `value` is itself an `Option` and `f` & `g` are redefined accordingly.

What gives? Wouldn't that make life much easier? Isn't `O.none` the same thing as `undefined` anyway?

# Something `Option` can do that `Nullable` Can't

Consider this contrived example:

```ts
const firstTerm: number | undefined = 3
const secondTerm: number | undefined = undefined
const sum: number | undefined = firstTerm
  ? secondTerm
    ? firstTerm + secondTerm
    : undefined
  : undefined
```

Here's how we might use this:

```ts
if (sum !== undefined) {
  console.log(`sum: ${sum}`)
} else {
  console.error(`Not enough terms`)
}
// output: Not enough terms
```

What if we want to print different error output depending on which term is missing?

```ts
if (sum === undefined) {
  // does 'firstTerm' exist or not?
}
```

## `undefined` can't nest

Ideally, we might want a type signature that looks like this:

```ts
const sum: number | undefined | undefined = firstTerm
  ? secondTerm
    ? firstTerm + secondTerm
    : undefined
  : undefined
```

Believe it or not, this compiles! But these two `undefined`s are the same. How would we know which is which?

This works because the compiler unifies these types under the hood. There are three possible return cases: `number`, `undefined`, and `undefined`. Typescript takes the [coproduct](https://en.wikipedia.org/wiki/Coproduct) of these cases, which removes the redundant `undefined` and flattens to `number | undefined`

For nullables, [`flatten`](https://github.com/gcanti/fp-ts/blob/7bee0ff7acd9d82cb87b252294b27d86c15cb501/test/Option.ts#L57) is [the identity function](https://en.wikipedia.org/wiki/Identity_function).

## `Option` saves the day!

```ts
import { flow } from 'fp-ts/function'
import { pipe } from 'fp-ts/pipeable'
import * as O from 'fp-ts/Option'

const firstTerm: O.Option<number> = O.some(3)
const secondTerm: O.Option<number> = O.none
const sum: O.Option<O.Option<number>> = pipe(
  firstTerm,
  O.map(firstTerm => pipe(
    secondTerm,
    O.map(secondTerm => firstTerm + secondTerm)
  )),
)
pipe(
  sum,
  O.fold(
    () => console.error(`First term doesn't exist`),
    O.fold(
      () => console.error(`Second term doesn't exist`),
      sum => console.log(`sum: ${sum}`)
    ),
  ),
)
// output: Second term doesn't exist
```

The magic here is in the type of `sum`:

```ts
const sum: O.Option<O.Option<number>>
```

`Option` nests! This means that we're able to track exactly where our operation failed.

## Metadata and Data: Sum Types vs Union Typs

[Gabriel Lebec](https://github.com/glebec) explained to me on the [fp-ts slack channel](https://functionalprogramming.slack.com/archives/CPKPCAGP4/p1593969845084700?thread_ts=1593968750.075600&cid=CPKPCAGP4) that `Option` gives us

> separation between meaningful layers (metadata vs. data)

Here, our metadata tells us whether an operation was successful or not.

`Option` is implemented as a [sum type](https://basarat.gitbook.io/typescript/type-system/discriminated-unions) (or tagged union or discriminated union), so under the hood, the metadata and the data are stored separately, like so: `{ _tag: 'Some', value: 3 }`. `_tag` is the metadata and `value` is the data. This allows us to nest different data together and keep their associated metadata separate.

On the flip side, a union with `undefined` combines the metadata and the data.

```ts
const separatedMetadata: O.Option<O.Option<number>> = {
  _tag: 'Some',
  value: {
    _tag: 'None'
  }
}
const coupledMetadata: number | undefined = undefined
```

A value of `undefined` is both the metadata of 'failure' and the data of 'no result'.

In contrast, a value of `3` is both the metadata of 'success' and the data of '3'.

```ts
const separatedMetadata2: O.Option<O.Option<number>> = {
  _tag: 'Some',
  value: {
    _tag: 'Some',
    value: 3
  }
}
const coupledMetadata2: number | undefined = 3
```

While the types `O.None` and `undefined` may seem similar, `{ _tag: 'None' }` has more information encoded into it than `undefined`. This is because `_tag` must be one of two values, while `undefined` has no such context. In the earlier case of `sum`, `undefined` smushes two different metadata together inseparably, resulting in information loss.

# Category Theory

While union types are simply the union of two categories

A ∪ B

Each element of a sum type necessarily has a [label](https://waleedkhan.name/blog/union-vs-sum-types/#theory) 'l'

A + B = ({l<sup>A</sup>} × A) ∪ ({l<sup>B</sup>} × B)

This label represents the category the object originated from. It allows each object can 'remember' where it came from.

We can also see in the above equation that a sum type is a union type, but not vice versa.

This is where the term 'tagged union' comes from.

In `Option`, this label is the `_tag` field.

When nested, the `_tag` field helps `Option` 'remember' whether it has succeeded or failed.

# Conclusion

Hopefully this has provided some insight into why `Option` was implemented as a sum type, and not a union type (nullable).

A month or two ago, I discovered that a monad instance of Nullable could be valid and have a simpler interface than the tagged union. I was excited, and I almost made a pull request to the library to 'fix' the 'problem' I had found.

Before I did that, however, I thought it would be wise to double check that this 'problem' was in fact a mistake. I asked the [fp-ts slack channel](https://functionalprogramming.slack.com/archives/CPKPCAGP4/p1593967904065100) why `Option` was implemented as a tagged union. You can click the link above to see the lovely explanations that people provided. Happily, I avoided implementing that pull request, and instead was redirected on a journey of learning that led me to write this article.

I am inspired by public forums where I'm able to ask basic questions and be taken seriously. I recommend joining the `fp-ts` and `typescript` slack channels [here](https://fpchat-invite.herokuapp.com), especially if you're interested in deeper understanding of functional programming.

The community is supportive and kind, and has helped me become a better developer.