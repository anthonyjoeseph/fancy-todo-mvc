![Three ducks redux](https://cdn.pixabay.com/photo/2018/04/15/08/53/duck-3321147__340.jpg)

# tl;dr

`redux` approximates the elm architecture w/o async capability. `redux-loop` and `elm-ts` both come close to exactly modeling elm, but `redux-observable` is simplest & most powerful. `redux-thunk` is naive, but popular enough that it influenced the design of `redux`

# What's up with Redux?

`redux` is super weird. Why would we architect an application that way? How did someone even think to write it like that?

`redux`, `redux-observable` and `react` itself are the consequences of many concepts that have built on each other and in some cases been discovered in parallel. A couple of them come from backend design. Though each concept is simple, they form a complex web of relations to each other.

I gave up trying to come up with a coherent way to present this information, so I cheated. We're going to start at the present day and work ourselves backwards through the history of what led to `redux`, `redux-observable` and `react`. Hopefully this is a useful way to present information that's not necessarily linear. If you're unclear or confused about a concept, just keep reading, I might explain it later.

This is an opinionated view of what happened. Please let me know if you disagree with anything or if I left out anything important in the comments below!

(I'm also putting this article out against a deadline, so I'll be going back in and fleshing out some parts of this over time)



# Timeline Overview

- [June 2020 - Halogen 5 Released](#halogen-5-released)
- [June 2017 - fp-ts-rxjs Gives Observable a Formal Monad Instance](#fp-ts-rxjs-gives-observable-a-formal-monad-instance)
- [March 2017 - elm-ts Ports the Elm Architecture to Typescript](#elm-ts-ports-the-elm-architecture-to-typescript)
- [November 2016 - redux-pack Released](#redux-pack-released)
- [May 2016 - Elm Abandons Strict FRP](#elm-abandons-strict-frp)
- [March 2016 - rxjs Version 5 Released](#rxjs-version-5-released)
- [Feb 2016 - redux-observable Released](#redux-observable-released)
- [Jan 2016 - redux-loop released](#redux-loop-released)
- [November 2015 - redux-saga Released](#redux-saga-released)
- [July 2015 - redux-thunk Released](#redux-thunk-released)
- [June 2015 - Iterables, Generators Released as Part of ECMAScript 2015 (es6)](#iterables--generators-released-as-part-of-ecmascript-2015--es6-)
- [May 2015 - redux is released](#redux-is-release)
- [May 2014 - Facebook open-sources Flux](#facebook-open-sources-flux)
- [May 2013 - Facebook open-sources React](#facebook-open-sources-react)
- [March 2012 - Elm released](#elm-released)
- [September 2011 - Facebook Releases FaxJS](#facebook-releases-faxjs)
- [Sometime Early 2010 (?) - Microsoft Releases ReactiveX](#microsoft-releases-reactivex)
- [February 2010 - Facebook Introuces XHP](#facebook-introuces-xhp)
- [June 1997 - Conal Elliot and Paul Hudak Introduce FRP](#conal-elliot-and-paul-hudak-introduce-frp)
- [Late 1980s - Haskell Team Invents & Discards redux observable](#haskell-team-invents---discards-redux-observable)
- [Sometime 1988 - CQS First Described by Bertrand Meyer](#sometime-1988)
- [Jan 1987 - Sagas First Described by Garcaa-Molrna and Salem](#sagas-first-described-by-garcaa-molrna-and-salem)
- [December 1979 - MVC Architecture Introduced by Trygve Reenskaug](#mvc-architecture-introduced-by-trygve-reenskaug)

# June 2020

## Halogen 5 Released

Purescript Halogen gets its latest major release as of October 2020.

Halogen is a project initially created by [Phil Freeman]((https://github.com/paf31)) (original developer of the PureScript compiler) and funded by [SlamData](https://github.com/slamdata) for  [use in their flagship app](https://gist.github.com/ryanartecona/1debe8d171ab9708d988714a440b1801). So what is Halogen?

Elm and `redux` have a problem - they use a single sum type used to effect changes on a single global state. This is a problem because there are conceptual and performance advantages to colocated state (analogous article in react [here](https://kentcdodds.com/blog/state-colocation-will-make-your-react-app-faster/)).

Halogen, which is a pure framework that uses a component architecture similar to `react`, solved this problem by introducing sum types to handle communications between different components, called `Query` and `Output`.

The release of [Halogen 5 introduces `Action`](https://github.com/purescript-halogen/purescript-halogen/blob/master/docs/changelog/v5.md#introducing-actions), which handles internal changees to a component's state. Presumably `Action` was named after redux's `Action`. This means that each component has its own conceptual `redux`, with three associated sum types:

- `Query` goes from parent -> child, e.g. a parent component telling a video component to start playing
- `Message` (AKA `Output`) goes from child -> parent, e.g. a dialog box component might want to invoke a dismissal function specified by its parent
- `Action` goes from child -> child, e.g. a clicked button makes an ajax request

There's also:

- `Input` which is analagous to `react` props

I mention this because Halogen is a logical extension of the ideas crystallized in `redux` and `react`. As such, `redux` and `react` can be simple frames through which to understand the complex Halogen architecture.

My theory is that `Halogen` was so named because of its adjacency to Functional Reactive Programming - in chemistry, the Halogens are [characterized by their reactivity](https://courses.lumenlearning.com/boundless-chemistry/chapter/halogens/). 

# June 2017

## fp-ts-rxjs Gives Observable a Formal Monad Instance

Giulio Canti's `fp-ts-rxjs` brings `rxjs` into the `fp-ts` ecosystem. It gives `Observable` an official monad instance, which it also transforms with `Either` for type-safe error handling and with `Reader` for dependency injection.

Also, it adds `fromIO` and `fromTask` operators, effectively turning `redux-observable` into an `IO` entry point for `fp-ts` programs using `IO` or `Task`.

# March 2017

## elm-ts Ports the Elm Architecture to Typescript

Giulio Canti's `elm-ts` proves that the Elm architecture can be represented in terms of `react` and `rxjs`. This makes it a saner alternative to `redux` + `redux-loop`.

The [type signature of `Cmd`](https://github.com/gcanti/elm-ts/blob/7c7780f250065658491dd0de8f28ea4087dffef9/src/Cmd.ts#L18) reveals it's strange frankenstein nature:

```ts
export interface Cmd<Msg> extends Observable<Task<Option<Msg>>> {}
```

I view this as proof that `redux-observable` is simpler and more powerful than the Elm architecture.

In fact, since elm [can't represent higher-kinded types](https://github.com/elm/compiler/issues/396) (typescript can by way of [fp-ts](https://gist.github.com/gcanti/2b455c5008c2e1674ab3e8d5790cdad5))), `elm-ts` is more powerful than elm itself.

# November 2016

## redux-pack Released

Only worth mentioning as an interesting approach to `redux` async middleware. Though it came out after `redux-saga` and `redux-observable`, it's interesting to think of a `Promise` of `Action` as a stepping stone to the idea of a stream of `Action`.

It was conceived because `redux-saga` was [seen as unwieldy](https://blog.isquaredsoftware.com/2017/01/idiomatic-redux-thoughts-on-thunks-sagas-abstraction-and-reusability/). I would say that the type safety and simplicity of `redux-observable` solves this problem without sacrificing any power.

# May 2016

## Elm Abandons Strict FRP

Elm gets rid of `Signal`, [favoring `Sub`](https://elm-lang.org/news/farewell-to-frp) instead (short for 'Subscription'). `Sub` is similar to `Observable`, except with fewer combinators and operators. For more complex usage of `Msg`, Elm keeps `Cmd`, which it still uses at the time of writing.

In my opinion, by the very nature of the fact that Elm tries to model events, it was never truly FRP in the first place.

# March 2016

## rxjs Version 5 Released

`rxjs` version 5, spearheaded by Netflix's Ben Lesh, is released. It's goals are to increase performance and stack safety.

Lesh collaborates with Microsoft, and has the type system in `Typescript` had to be changed to accomodate `rxjs`. He also collaborates with Google, who make `rxjs` fundamental to Angular in their release of Angular 2.

[Source](https://www.youtube.com/watch?v=COviCoUtwx4)

# Feb 2016

## redux-observable Released

Netflix releases `redux-observable`, which updates `redux-saga`'s pull-based `Iterable` streams to more appropriate push-based `Observable` streams.

While pull-based streams are great for handling back-presure, they make less sense for event handling. To [paraphrase Ben Lesh](https://youtu.be/COviCoUtwx4?t=518) (a principal maintainer of rxjs), "imagine every individual mouse event was represented as a js promise".

Since `redux` is a front-end tool that handles events of one kind or another, a push-based architecture makes more sense.

It also provides a lush library of stream operators and combinators by way of `Observable` and `rxjs`. However, later this same month `ixjs` will be released, providing similar operators and combinators for Iterables.

The name `epic` is chosen to [sound similar to yet different from](https://youtu.be/AslncyG8whg?t=1380) `saga`.

`redux-observable`'s logo is a circling loop colored similar to the `ReactiveX` electric eel. It loops because of the recursive nature of `epics`. They are three ducks because the Netflix team thought the word 'redux' sounded like 'three ducks'.

![three ducks](https://redux-observable.js.org/logo/logo-small.gif)

# Jan 2016

## redux-loop released

`redux-loop` ports the Elm architecture to `redux` as an async middleware.

While a noble effort, it's a bit of a mess. [Check out the type signature for Cmd](https://github.com/redux-loop/redux-loop/blob/master/index.d.ts) (it's too complicated and involved to reprint here.) `redux-observable`'s `Epic` is far simpler.

# November 2015

## redux-saga Released

`redux-saga` is an async middleware for `redux` that uses the 'saga' pattern. From the [home page](https://redux-saga.js.org/):

> The mental model is that a saga is like a separate thread in your application that's solely responsible for side effects.

Earlier this year in July, Caitie McCaffrey [gave a talk](https://www.youtube.com/watch?v=xDuwrtwYHu8) about her usage of the Saga pattern to develop Halo 4 at Microsoft. This was the inspiration, in part, for `redux-saga`.

# July 2015

## redux-thunk Released

The original async middleware for `redux`, cited in its [documentation](https://redux.js.org/advanced/async-actions).

`redux` is so closely tied to `redux-thunk` that it changed its type signatures to accommodate it.

Let's examine the `useDispatch` hook in `react-redux`. Here's how you might expect it to work:

```ts
import { useDispatch } from 'react-redux'

const Comp = () => {
  const dispatch: (a: AppAction) => void = useDispatch<AppAction>()
  return (...)
}
```

But here's how it actually works:

```ts
const dispatch: (a: AppAction) => void = useDispatch<(a: AppAction) => void>()
```

What's up with that type signature? Why don't we just have to prove our `Action` type? Why do we have to provide the type signature for the dispatcher itself?

This is because with redux-thunk, it's possible to dispatch a function, so the type system has to be flexible enough to accomodate this. Here's an example of a function that might get dispatched (taken from the [`redux` docs](https://redux.js.org/advanced/async-actions)):

```ts
export function fetchPostsIfNeeded(subreddit) {
  // Note that the function also receives getState()
  // which lets you choose what to dispatch next.

  // This is useful for avoiding a network request if
  // a cached value is already available.

  return (dispatch, getState) => {
    if (shouldFetchPosts(getState(), subreddit)) {
      // Dispatch a thunk from thunk!
      return dispatch(fetchPosts(subreddit))
    } else {
      // Let the calling code know there's nothing to wait for.
      return Promise.resolve()
    }
  }
}

dispatch(fetchPostsIfNeeded('reactjs'))
```

The anonymous function returned by `fetchPostsIfNeeded` is the titular 'thunk', although this is a misuse of the word - a 'thunk' is [necessarily parameterless](https://stackoverflow.com/a/925538/615493), since it represents a value that has already been 'thought through' and has no potential for change.

This is where `redux` starts to show its age. Though it was developed to bring functional concepts to javascript, it existed in a time before static typing with Typescript became popular. Some of its behavior is weird, and the type system has trouble keeping up with it.

Similarly, the type for store is 

# June 2015

## Iterables, Generators Released as Part of ECMAScript 2015 (es6)

`es6` saw an [expansion on es4's `Iterators`](https://auth0.com/blog/a-brief-history-of-javascript/) with `Iterables`. An `Iterable` is a generalization of any pull based stream, pulled with the `yeild` keyword.

Iterables are not necessarily asynchronous: `Arrays` are Iterables too. This is part of the reason that reactive streams are not part of Functional Reactive Programming (FRP). A stream is by nature a sequence of discrete values, while FRP models continuous values as they relate to continuous time.

# May 2015

## redux is released

`redux` comes into being as a way to reconcile Dan Abramov's package [react-hot-loader](https://github.com/gaearon/react-hot-loader) with Facebook's Flux architecture. It is explicitly [based on the Elm architecture](https://redux.js.org/understanding/history-and-design/prior-art). It's introduced a couple months later in a popular talk titled "Live React: Hot Reloading with Time Travel"

At the time, Elm used something called a `Signal`. Signals composed together using a function called [foldp](https://csmith111.gitbooks.io/functional-reactive-programming-with-elm/content/section5/Signals.html):

```haskell
foldp : (a -> s -> s) -> s -> Signal a -> Signal s
```

This has three parts: the `a -> s -> s` is a function that takes an Action 'a' and the current state 's', and returns a new state 's'. The `-> s` after that represents the initial state. This is all then used convert a signal from its Action to new state.

Abramov, seeing this first part `a -> s -> s` recognized this as the function signature of es6 `reduce`. `fold`, when used on a product type in javascript, is called `reduce`. This word `reduce`, is the namesake of the `reducer`, which has a similar function signature.

The word `reducer`, combined with `Flux`, is the namesake of `redux`. The word 'redux' in English also means ['brought back, or revisited'](https://en.wiktionary.org/wiki/redux#Etymology) - presumably, redux brings Flux back into the mainstream (?)

Part of the concept of reducers was that they'd be composable - a classically functional goal to be sure. Given that state is normally represented as a javascript object, each key of the object was to be given it's own reducer

```ts
import { combineReducers } from 'redux'

interface AppState {
  user: User
  current: Current
  settings: Settings
}
const userReducer: (u: User | undefined, a: Action) => User = ...
const currentReducer: (c: Current | undefined, a: Action) => Current = ...
const settingsReducer: (s: Settings | undefined, a: Action) => Settings = ...

const reducer: (s: AppState | undefined, a: Action) => AppState = combineReducers(
  userReducer,
  currentReducer,
  settingsReducer
)
```

Notice that each sub-reducer can be passed in an undefined state, but must always return a value. This is because, in keeping with the compositionality theme, each reducer is responsible for initializing its own data.

Unintuitively, redux will [propagate an action called `@@INIT` through its reducer](https://stackoverflow.com/questions/41305492/what-is-the-purpose-of-the-init-action-in-react-redux) to collect this initialized state. In my opinion, this is a design flaw that can lead to unexpected behavior.

Despite all this, `redux` is a beautiful system. In the talk, `redux` is framed as bringing functional architecture to the mainstream. To quote:

> These are not new things. I did not invent them. Some people will tell you that they existed 30 years ago, and maybe they'll be right, but we'll never find out if nobody talks about bringing cool functional techniques to javascript.

> Because if you learn a cool programming language like Elm or Clojurescript, you stay there. It doesn't have to be this way.

> You know, you can share your knowledge, please do. Because you can do functional in javascript. You can bring functional programming to the mainstream and do really cool stuff with it.

# May 2014

## Facebook open-sources Flux

Flux is facebook's implementation of MVC & CQRS on the client side. It's introduced in a talk called ["Rethinking Web App Development at Facebook"](https://www.youtube.com/watch?list=PLb0IAmt7-GS188xDYE-u1ShQmFFGbrk0v)

# May 2013

## Facebook open-sources React

In a [surprisingly unpopular](https://blog.risingstack.com/the-history-of-react-js-on-a-timeline/) talk called ["JS Apps at Facebook"](https://www.youtube.com/watch?v=GW0rj4sNH2w), Jordan Walke introduces `react` to the public.

Given its name, it seems that `react` came from 'Functional Reactive Programming'. However, the developers [deny this](https://reactjs.org/docs/design-principles.html):

> The control over scheduling would be harder for us to gain if we let the user directly compose views with a “push” based paradigm common in some variations of Functional Reactive Programming ... There is an internal joke in the team that React should have been called “Schedule” because React does not want to be fully “reactive”.

# March 2012

## Elm released

Evan Czaplicki's [Harvard undergrad thesis](https://www.seas.harvard.edu/news/2015/10/alumni-profile-evan-czaplicki-ab-12), named Elm, is released. The idea is to model a web UI using FRP in an accessible way.

[The original paper](https://elm-lang.org/assets/papers/concurrent-frp.pdf) documents different approaches to FRP & functional UI design through the 2010s. It's interesting to see how the ideas evolved over time.

It's easy to think that `react` took major inspiration from Elm. Here's a passage in the introduction from Elm's original paper:

> Functional reactive programming is a declarative approach to GUI design. The
term declarative makes a distinction between the “what” and the “how” of programming ... With functional reactive programming, many of the irrelevant details are left to the compiler ... The term declarative is important because most current frameworks for graphical user interfaces are not declarative ... The declarative approach of functional reactive programming makes it quick and easy to specify complex user interactions. FRP also encourages a greatly simplified approach to graphical layout. As a result, FRP makes GUI programming much more manageable than with traditional approaches

Sound familiar? Here's a quote from the react.js homepage:

> React makes it painless to create interactive UIs. Design simple views for each state in your application, and React will efficiently update and render just the right components when your data changes ... Declarative views make your code more predictable and easier to debug.

Even if the name `react` was never meant to refer to FRP, clearly the ideas here are similar, yet both radical departures from the norm.

It is not clear, however, that `react` is at all based on Elm, as `FaxJS` and `XHP` have been in development for some time by now. I choose to believe that `Elm` and `react` were unaware of each other.

The two projects came to denotative design through radically different means: React from syntactic sugar by way of XHP, and Elm through academic rigor by way of frp. Like [Hindley-Milner](https://en.wikipedia.org/wiki/Hindley%E2%80%93Milner_type_system) or [Leibniz-Newton](https://en.wikipedia.org/wiki/Leibniz%E2%80%93Newton_calculus_controversy), the same concept was discovered twice. Phil Wadler, who [brought monads into Haskell](https://homepages.inf.ed.ac.uk/wadler/papers/marktoberdorf/baastad.pdf) (building on [Eugenio Moggi's work](https://core.ac.uk/download/pdf/21173011.pdf)), often speaks of [discovery as opposed to invention](https://corecursive.com/021-gods-programming-language-with-philip-wadler) in mathematics in a similar way.

# September 2011

## Facebook Releases FaxJS

[FaxJS](https://github.com/jordwalke/FaxJs) is an early prototype of React.

```ts
var MainComponent = exports.MainComponent = F.Componentize({
  structure : function() {
    return Div({
      firstPerson: PersonDisplayer({
        name: 'Joe Johnson', age: 31,
        interests: 'hacking, eating, sleeping'
      }),

      secondPerson: PersonDisplayer({
        name: 'Sally Smith', age: 29,
        interests: 'biking, cooking swiming'
      }),

      thirdPerson: PersonDisplayer({
        name: 'Greg Winston', age: 25,
        interests: 'design and technology'
      })
    });
  }
});
```

You can see the denotative nature of the component architecture here.

# Sometime Early 2010 (?)

## Microsoft Releases ReactiveX

ReactiveX, originally developed by Microsoft for their `.NET` system, models a stream called an `Observable` and gives it combinators and operations inspired by their own `LINQ` library. LINQ handles communications with databases. From their homepage:

> Rx = Observables + LINQ + Schedulers

(Schedulers also exist in `rxjs`. They control the nature of the concurrency of an `Observable`)

Uses the same electric eel logo as the 2007 Microsoft project Volta because they were [created by the same team](https://channel9.msdn.com/blogs/charles/getting-started-with-rx-extensions-for-net).

![The reactive electric eel](https://images.ctfassets.net/pqts2v0qq7kz/3TSlPP6nzGYWiQQYKmEY6g/9907822eb6bd0ca406bb463047be1b19/Rx_Logo_512.png_1368585296?w=800&q=80)

Date inferred from [here](https://subscription.packtpub.com/book/application_development/9781787120426/1/01lvl1sec7/a-brief-history-of-reactivex-and-rxjava#:~:text=RxJava%2C%20the%20ReactiveX%20port%20for,RxJava%202.0%20in%20November%202016.). Earliest doc found [here](https://docs.microsoft.com/en-us/previous-versions/dotnet/reactive-extensions/hh242985(v=vs.103)), in June 2011.

# February 2010

## Facebook Introuces XHP

[XHP](https://www.facebook.com/notes/facebook-engineering/xhp-a-new-way-to-write-php/294003943919/) allows the direct usage of xml inside of php files.

```php
if ($_POST['name']) {
  echo Hello, {$_POST['name']};
} else {
  echo
    <form method="post">
      What is your name?
      <input type="text" name="name" />
      <input type="submit" />
    </form>;
}
```

This syntactic sugar is the precursor to JSX, whose denoatative nature will eventually make `react` so powerful.

# June 1997

## Conal Elliot and Paul Hudak Introduce FRP

At the International Conference on Functional Programming in the Netherlands, Conal Elliot and Paul Hudak introduce [their paper](http://conal.net/papers/icfp97/) titled "Functional Reactive Animation" (Fran for short). This idea will later be renamed Functional Reactive Programming (FRP).

Conal Elliot discusses the difference between FRP vs Reactive Programming in [this SO post](https://stackoverflow.com/questions/5875929/specification-for-a-functional-reactive-programming-language#5878525). FRP is by definition:

(a) denotative
(b) temporally continuous

Elliot also wrote a great post titled [Why Program with Continuous Time](http://conal.net/blog/posts/why-program-with-continuous-time), which is about pushing compromises to the boundaries of your system.

ReactiveX and FRP are fundamentally at odds: FRP's `Behavior` is by definition continuous while `Observable` is by definition discrete. FRP's `Behavior` is by definition pure (implied by [denotative](http://conal.net/blog/posts/is-haskell-a-purely-functional-language#comment-626)) while `Observable` is by definition effectful (thus fp-ts-rxjs's `fromIO`). They both model streams, but in their intentions they are exact opposites.

In the same SO post, Elliot talks about FRP as it relates to `rxjs` specifically:

> As far as I can tell, Rx and Bacon.js lack both of the two fundamental properties on which I based the original FRP. In that sense, they're not what FRP set out to be. Which is fine with me, as I love to see a multitude of abstractions explored. Using a single term to describe them all, however, creates more confusion about what each means and how they differ. I think an accurate description of Rx and Bacon.js is "compositional event systems inspired by FRP".

It's a (really) bad example, but FRP as originally envisioned is closer to React Native's `Animated` library than to `rxjs`, Sagas or `redux-observable`. Continuous time is represented by an `Animated.Value`, and denotative transformations like `Delay` and `Spring` are applied before it's interpolated into actual positions at each frame. It doesn't look much like the Behaviors and Events described in the formal papers, but its continuous nature is closer in spirit than the discrete events output by `Observable`.

Elliot has said that hearing people refer incorrectly refer to non-FRP systems as FRP is ['heartbreaking for me personally'](https://youtu.be/j3Q32brCUAI?t=204).

The terms 'Functional Reactive Programming' and 'ReactiveX' are confusingly similar - 'ReactiveX' debatably uses a functional paradigm (['functional' is a poorly defined term](http://conal.net/blog/posts/is-haskell-a-purely-functional-language#comment-626)), and they're both technically Reactive Programming. They are antonyms masquerading as synonyms!

Ben Lesh (lead maintainer of `rxjs`) [tweeted about this confusion](https://twitter.com/BenLesh/status/701821818475192320) - Elliot's reply: 

> Then perhaps better to discuss content first and names later.

# Late 1980s

## Haskell Team Invents & Discards redux observable

From Simon Peyton Jones's ["Escape from the Ivory Tower"](https://www.youtube.com/watch?v=re96UgMk6GQ&t=2386s)

> A haskell program was simply a program from string to string ... This was a bit embarrassing. So after a bit we thought, maybe instead of producing a string, we'll produce a sequence of commands like "print hello," or "delete this file," which we can execute. So you can imagine, to run the program you call a program passing in some input and you get back a string of commands which some external command execution engine would - the evil operating system - the functional program is very good and pure and produces only a data structure, and the evil side-effecting operating system consumes these commands and executes them.

> Well that's not very good if you want to read a file, because if you open a file and want to read it's contents, how does a program get access to it's contents? Ah! Maybe we can apply the function to the result of the evil external thing doing its work. So now there's this sort of loop between the pure functional program and the evil external operating system.

> It didn't work very well at all. It was very embarrassing for a number of years.

Eventually, the solution that the Haskell team came to was the IO monad, as described in 1993's [Imperative Functional Programming](https://www.microsoft.com/en-us/research/wp-content/uploads/1993/01/imperative.pdf)

# Sometime 1988

## CQS First Described by Bertrand Meyer

Command query responsibility segregation (CQRS) is a continuation of the principle proposed by Bertrand Meyer (1988) called command query separation (CQS)

[2014 paper on CQRS](http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.843.2533&rep=rep1&type=pdf)

Earliest doc I could find on CQRS is from Greg Young's November 2011 [CQRS Documents](https://cqrs.files.wordpress.com/2010/11/cqrs_documents.pdf)

Greg Young says [CQRS is basically MVC](http://codebetter.com/gregyoung/2010/09/07/cqrs-and-mvc/)

# Jan 1987

## Sagas First Described by Garcaa-Molrna and Salem

[paper](https://www.cs.cornell.edu/andru/cs711/2002fa/reading/sagas.pdf)

Sagas [relate to CQRS](https://docs.microsoft.com/en-us/previous-versions/msp-n-p/jj591569(v=pandp.10)?redirectedfrom=MSDN#sagas-and-cqrs)

# December 1979

## MVC Architecture Introduced by Trygve Reenskaug

[paper](http://heim.ifi.uio.no/~trygver/1979/mvc-2/1979-12-MVC.pdf)

# Conclusion

From an engineering standpoint, short of implementing an undo history, `redux-observable` is really a solution in search of a problem - it makes little sense. However, from a historical perspective, `redux-observable` is the logical conclusion of attempts at a purely functional frontend architecture, achieved by way of streams, CQRS and the Saga pattern. Hopefully it's easier to understand where and when `redux-observable` is an appropriate solution given a more whole understanding of its history.

I think deep understanding is a common difficulty in programming. React hooks are [difficult to understand for many new developers](https://dev.to/kentcdodds/what-s-hard-about-react-hooks-for-you-f0n). I would contend that it's easier to understand them if you have experience using [`setState`](https://css-tricks.com/understanding-react-setstate/), and have a concept for react components as [fundamentally object-oriented](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/33cd4a2b40827ce3ae0260fe5bf6a3b1f62d49f5/types/react/index.d.ts#L436) ([unfortunately](http://harmful.cat-v.org/software/OO_programming/)).

However, even given this understanding, it was initially difficult for me to truly wrap my head around hooks. Why are there ['rules'](https://reactjs.org/docs/hooks-rules.html) that are impossible to enforce at compile time? Why do we need an entirely [separate library](https://github.com/testing-library/react-hooks-testing-library) to test them? Why is that weird one called [useEffect](https://reactjs.org/docs/hooks-effect.html)? And how do they actually work?

It helped to learn that react hooks are actually a vastly simplified implementation of [algebraic effects](https://github.com/reactjs/rfcs/pull/68#issuecomment-433158179). This explains so much to me - hooks are an extreme approximation, so by definition flawed and strange. Indeed, Dan Abramov of the react team has [written candidly](https://overreacted.io/algebraic-effects-for-the-rest-of-us/) that for him 'much discussion about algebraic effects is incomprehensible'. I don't mean to advocate against hooks or criticize Abramov - I think some hooks can be super useful, and I don't fully understand algebraic effects either. I only mean to say that a wholesale understanding of hooks and the complexity of its origins helps understand how best to use them (minimally).

The point is that often, mere documentation is not enough. Interfaces are abstractions, and all [non-trivial abstractions leak to some degree](https://www.joelonsoftware.com/2002/11/11/the-law-of-leaky-abstractions/).

This is true on the backend especially. For example, Apache Kafka is almost impossible to understand without first understanding the solutions that preceded it.

I think this is sometimes unfortunately used as a form of gatekeeping - new developers are told to [RTFM](https://en.wikipedia.org/wiki/RTFM), when the M can only tell you _what_ something is without really describing _why_ it exists.

This is discussed in the paper [What we Talk About When We Talk About Monads](http://tomasp.net/academic/papers/monads/monads-programming.pdf), although in reverse. Here, the problem is that teachers often introduce monads based on their history in category theory, and eschew simple metaphors like the burrito.

They argue that the relation of programming to category theory is based on hypothesis rather than fact, referring to it as a `purely functional research programme`. It's not only harmful but inaccurate to decry metaphors that aid understanding.

> A typical introduction to monads links the concept to its formal origin ... It is worth noting that this is what historians call an “internal history” – a history told within the discipline of computer science.

> ...Some authors treat such metaphorical explanations as kludges that are only needed because the concept is difficult to explain otherwise. We argue that this is not the case and the metaphors are an important part of what a monad is.

> ...[For some,] A simple category theoretical definition leads to a programming construct that is useful in practice. For others, it symbolizes the elitism of incomprehensible “ivory tower” approach to programming.

> ...Learning monads seems to have an aspect of what anthropologists call a rite of passage.

Poor explanations - irrelevant context for monads or missing context for redux, can be used to make concepts deliberately opaque.

The paper further posits that programming concepts ought to be thought of across three levels: 'formal', 'implementation' and 'metaphorical'. They discuss this in context of monadic solutions that ended up not being useful.

> ... We suggest that treating monads in a more comprehensive way and considering the formal, implementation and metaphorical level could have prevented the undesirable use of monads

> ...This is, most likely, the result of the social side of monads. They are a topic of interest for the community and they became a key tool of the purely functional research programme.

I guess this long, rambling conclusion can best be ended on this point - programming is a human endeavor, and the so-called "social side" and the history can be as important as the code itself for understanding what the hell people are talking about.