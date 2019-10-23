# What is this thing??

We are currently stuck on `@movable/ember-cli-mirage@0.2.9`. This is a custom fork of it, modified to fit better into a modern Ember build process.

***

[![Build Status](https://github.com/movableink/ember-cli-mirage/workflows/Lint%20and%20Test/badge.svg)](https://github.com/movableink/ember-cli-mirage/actions?workflow=Lint+and+Test)
[![npm version](https://badge.fury.io/js/%40movable%2Fember-cli-mirage.svg)](https://badge.fury.io/js/%40movable%2Fember-cli-mirage)

# Ember CLI Mirage


A client-side server to develop, test and prototype your Ember CLI app.

<http://www.@movable/ember-cli-mirage.com/>

----

Are you tired of

- Writing one set of fixtures for your tests, and another for development?
- Wiring up tests for each of your apps manually, from scratch?
- Changing lots of files/tests when your API changes?

Ember CLI Mirage may be for you! It lets you create a client-side server using [Pretender](https://github.com/trek/pretender) to help you develop and test your app. By default, it only runs if you're not in production and if you're not proxying to an explicit API server via `ember serve --proxy`.

## Installation

```sh
ember install @movable/ember-cli-mirage  # install:addon for Ember CLI < 0.2.3
```

## Updating

This project is new and the API is subject to change. When updating your project to a newer version of Ember CLI Mirage, please consult [the changelog](/CHANGELOG.md) for any update notes.

## Getting started

Check out the [Docs](http://www.@movable/ember-cli-mirage.com/docs/v0.2.x/)!

## Support

Having trouble? Open an issue!

You can use the [Mirage Boilerplate Twiddle](https://ember-twiddle.com/eedfd390d8394d54d5bfd0ed988a5d0f) to reproduce your issue.

## Contributing

Have a look at our [Contributing guidelines](./CONTRIBUTING.md).
