# Fancy TODO-mvc

The goal of this project is to show the advantages of using fp-ts & friends vs a more traditional approach to building a web app.

Since lodash solutions are often simpler than fp-ts based solutions for smaller problems, it's necessary to show a larger application to see the benefits.

The idea is to show the simplest example of a project with tangible benefits from an fp approach. This provides a point of comparison as well as a document of best practices.

# The App

This is based on the [todo-mvc](http://todomvc.com/) project because it's well known.

This is a 'fancy' version of todo-mvc that communicates with a simple backend.

# Dev Environment

This is a Typescript ui & api monorepo based on the structure outlined on this [smashing magazine article](https://www.smashingmagazine.com/2019/07/yarn-workspaces-organize-project-codebase-pro/)

The client was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

The server was bootstrapped with [express-generator-typescript](https://github.com/seanpmaxwell/express-generator-typescript)

# The client

Uses fp-ts, fp-ts-routing, @morphic-ts/adt, react, @testing-library/react, jest

# The server

Users fp-ts, express, hyper-ts, supertest, jest

Runs on a postgres server. Migrations with flyway

# Shared btwn client and server

io-ts codecs for the api endpoints and the data models.
