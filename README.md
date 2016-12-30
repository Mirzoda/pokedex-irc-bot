# Pokedex irc bot
[![Build Status](https://travis-ci.org/jerodev/pokedex-irc-bot.svg?branch=master)](https://travis-ci.org/jerodev/pokedex-irc-bot)

Pokedex is an irc bot written in nodejs. All commands are written in seperate
modules so the bot can easily be extended.

## How to use

Pokedex irc bot requires nodejs and npm to run.
You can use the following commands to start pokedex:

```
npm install         # Install required packages
gulp                # Convert the code from ES6 to ES5
node dist/main.js   # Run Pokedex
```

## Testing

Pokedex has several mocha test included to test if the code for a certain command is working.
When adding a test and if possible, please add a test file in the corresponding folder in the `/test` folder.

Testing can be done simply by running the `mocha` command in terminal.