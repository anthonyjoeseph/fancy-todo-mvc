import React from 'react';
import MockableApp from "./MockableApp";

const App = () => (
  <MockableApp
    pushUrl={url => window.history.pushState(null, '', url) }
  />
);

export default App