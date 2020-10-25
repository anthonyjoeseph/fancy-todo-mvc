# Fancy TODO-mvc

The goal of this project is to show the advantages of using fp-ts & friends vs a more traditional approach to building a web app.

Since lodash solutions are often simpler than fp-ts based solutions for smaller problems, it's necessary to show a larger application to understand benefits.

The idea is to show the simplest example of a project with tangible benefits from an fp approach. This provides a point of comparison as well as a document of best practices.

The comparison will focus on the frontend (client) code, but the backend is also written type-safely.

# The App

This is based on the [todo-mvc](http://todomvc.com/) project because it's well known.

This is a 'fancy' version of todo-mvc that communicates with a simple backend.

# The client

Uses [fp-ts](https://github.com/gcanti/fp-ts), [fp-ts-routing](https://github.com/gcanti/fp-ts-routing), [@morphic-ts/adt](https://github.com/sledorze/morphic-ts), [react](https://github.com/facebook/react), [@testing-library/react](https://github.com/testing-library/react-testing-library), [jest](https://github.com/facebook/jest)

Counter example will feature [lodash](https://github.com/lodash/lodash) and [react-router](https://github.com/ReactTraining/react-router) (and we will also note the advantages of these vs less modern approaches)

# The server

Users [fp-ts](https://github.com/gcanti/fp-ts), [express](https://github.com/expressjs/express), [hyper-ts](https://github.com/gcanti/hyper-ts), [pg-promise](https://github.com/vitaly-t/pg-promise), [supertest](https://github.com/visionmedia/supertest), [jest](https://github.com/facebook/jest)

Backed by a postgres server. SQL migrations with [node-flywaydb](https://github.com/markgardner/node-flywaydb)

# Shared btwn client and server

[io-ts](https://github.com/gcanti/io-ts) codecs for the api endpoint requests and internal data models (Todo and User).

# Dev Environment

It's a [PERN stack](https://www.geeksforgeeks.org/what-is-pern-stack/)

This is a Typescript ui & api monorepo based on the structure outlined on this [smashing magazine article](https://www.smashingmagazine.com/2019/07/yarn-workspaces-organize-project-codebase-pro/)

The client was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

The server was (vaguely) bootstrapped with [express-generator-typescript](https://github.com/seanpmaxwell/express-generator-typescript)
