import React from 'react';
import MockableApp from "./MockableApp";
import { pipe } from 'fp-ts/pipeable'
import * as T from 'fp-ts/Task'

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

const App = () => (
  <MockableApp
    pushUrl={url => window.history.pushState(null, '', url) }
  />
);

export default App

