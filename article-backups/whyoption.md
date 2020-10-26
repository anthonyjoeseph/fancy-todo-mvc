![Removing the label](https://static1.squarespace.com/static/54093b42e4b06b763c30cb28/t/5417ac47e4b0d2ecae1ee692/1410837577087/BeerBottles_091514_04.jpg)

# tl;dr

`Option` contains more data when nested than traditional [nullable](https://www.typescriptlang.org/docs/handbook/advanced-types.html#nullable-types) values do.

# Contents

- [The problem](#the-problem)
- [Something `Option` can do that `Nullable` Can't](#something--option--can-do-that--nullable--can-t)
  * [`undefined` can't nest](#-undefined--can-t-nest)
  * [`Option` saves the day!](#-option--saves-the-day-)
  * [Metadata and Data: Sum Types vs Union Typs](#metadata-and-data--sum-types-vs-union-typs)
- [Set Theory](#set-theory)
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
import { identity } from 'fp-ts/function'

type Option<A> = A | undefined
export const OptionMonad = {
  of: identity,
  chain: <A, B>(fa: Option<A>, f: (a: A) => Option<B>): Option<B> => fa !== undefined ? f(fa) : undefined,
}
```

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

## Metadata and Data: Sum Types vs Union Types

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

# Set Theory

While union types are simply the union of two sets

A ∪ B

Each element of a sum type necessarily has a [label](https://waleedkhan.name/blog/union-vs-sum-types/#theory) 'l'

A + B = ({l<sup>A</sup>} × A) ∪ ({l<sup>B</sup>} × B)

This label represents the set the object originated from. It allows each object can 'remember' where it came from.

We can also see in the above equation that a sum type is a union type, but not vice versa.

This is where the term 'tagged union' comes from.

In `Option`, this label is the `_tag` field.

When nested, the `_tag` field helps `Option` 'remember' whether it has succeeded or failed.

# Category Theory

Another way to think about nestabiltiy is through the lens of formal monadic correctness.

Remember our `OptionMonad` instance defined earlier? Although it's is correctly typed, it is not in fact a proper monad instance - it fails the [left identity law](https://wiki.haskell.org/Monad_laws)

```ts
const f = (_: undefined): number => 1
const leftTerm = OptionMonad.chain(OptionMonad.of(undefined), f)
const rightTerm = f(undefined)
const leftIdentity = leftTerm === rightTerm
console.log(`${leftTerm} vs. ${rightTerm}`)
console.log(`left identity passes? ${leftIdentity}`)
// undefined vs. 1
// left identity passes? false
```

The monadic left identity deals with flattening and wrapping[^1] - basically it asks the question "do the flattening from `chain` and the wrapping from `of` consistently cancel each other out?"

In our case, the answer is no. Since our `of` is the identity function, it doesn't really wrap anything. Since our `chain` function has no wrapper to unwrap, it must short circuit on all `undefined` values, even if `undefined` was the value that we wanted it to pass through. Directly invoking `f` with an `undefined` value returns a `number`, so our behavior is shown to be inconsistent.

This proves in a simple way the pragmatic, engineering use of the monad laws (or one of them, anyway). The left identity ensures that monads are meaningfully nest-able.

Remember this the next time you find yourself frustrated by `O.fromNullable` - you are lifting your unmarked data into a glorious nestable mathematically sound monadically wrapped value!

# Conclusion

Hopefully this has provided some insight into why `Option` was implemented as a sum type, and not just a union type - and as a bonus, provided some insight into the practical benefits of proper category theoretical monads.

A month or two ago, I 'discovered' that a monad instance of Nullable could be valid (it's not) and have a simpler interface than the tagged union. I was excited, and I almost made a pull request to the library to 'fix' the 'problem' I had found.

Before I did that, however, I thought it would be wise to double check that this 'problem' was in fact a mistake. I asked the [fp-ts slack channel](https://functionalprogramming.slack.com/archives/CPKPCAGP4/p1593967904065100) why `Option` was implemented as a tagged union. You can click the link above to see the lovely explanations that people provided. Happily, I avoided implementing that pull request, and instead was redirected on a journey of learning that led me to write this article.

I am inspired by public forums where I'm able to ask basic questions and be taken seriously. I recommend joining the `fp-ts` and `typescript` slack channels [here](https://fpchat-invite.herokuapp.com), especially if you're interested in deeper understanding of functional programming.

The community is supportive and kind, and has helped me become a better developer.

(edit:) The slack community continues to support me! Thanks to [Monoid Musician](https://github.com/MonoidMusician) for pointing out that sum types & union types belong to set theory, not category theory, and for pointing out that `OptionMonad` fails the monad laws.

[^1]: Some people dislike the wrapper metaphor - they correctly assert that it only describes a few monads, and only leads to more confusion later when introduced to more. Here are a couple of paradigmatic tweets ([1](https://twitter.com/impurepics/status/1283660072380502016/photo/1), [2](https://twitter.com/YuriyBogomolov/status/1283237296402243585)).

  However, the paper [What we Talk About When we Talk About Monads](http://tomasp.net/academic/papers/monads/monads-programming.pdf) posits that such metaphors are necessary for a complete understanding of the concept, alongside 'formal' and 'implementation'-level knowledge.