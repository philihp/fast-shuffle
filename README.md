# Fast Shuffle

[![Version](https://badge.fury.io/js/fast-shuffle.svg)](https://www.npmjs.com/package/fast-shuffle)
![Tests](https://github.com/philihp/fast-shuffle/workflows/tests/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/philihp/fast-shuffle/badge.svg?branch=main)](https://coveralls.io/github/philihp/fast-shuffle?branch=main)
![Downloads](https://img.shields.io/npm/dw/fast-shuffle)
![License](https://img.shields.io/npm/l/fast-shuffle)

A fast, side-effect-free, and O(n) array shuffle that's safe for functional programming and use within Redux reducers.

## Usage

```
npm install --save fast-shuffle
```

```js
import { shuffle } from 'fast-shuffle'

const suits = ['♣', '♦', '♥', '♠']
const faces = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']
const sortedDeck = suits.map((suit) => faces.map((face) => face + suit)).flat()
// [ '2♣', '3♣', '4♣', '5♣', '6♣', '7♣', '8♣', ...

const shuffledDeck = shuffle(sortedDeck)
// [ '3♥', '3♦', 'K♥', '6♦', 'J♣', '5♠', 'A♠', ...
```

The named `shuffle` export seen above draws from `Math.random`. This is the easiest way to use the library, but it may be useful to create a purely functional shuffler which takes either a random seed which is used in a [PCG](https://www.pcg-random.org/) for entropy, or your own randomizer: a function that returns either a float in [0, 1), like `Math.random`, or an unsigned 32-bit integer, like most seeded generators.

```js
import { createShuffle } from 'fast-shuffle' // note the change

const letters = ['a', 'b', 'c', 'd', 'e']
const shuffleRed = createShuffle(12345)
shuffleRed(letters) // [ 'c', 'b', 'e', 'd', 'a' ]
shuffleRed(letters) // [ 'c', 'e', 'b', 'd', 'a' ]
shuffleRed(letters) // [ 'c', 'b', 'a', 'd', 'e' ]
shuffleRed(letters) // [ 'c', 'a', 'b', 'e', 'd' ]

const shuffleBlue = createShuffle(12345)
shuffleBlue(letters) // [ 'c', 'b', 'e', 'd', 'a' ]
shuffleBlue(letters) // [ 'c', 'e', 'b', 'd', 'a' ]
shuffleBlue(letters) // [ 'c', 'b', 'a', 'd', 'e' ]
shuffleBlue(letters) // [ 'c', 'a', 'b', 'e', 'd' ]
```

Your own randomizer makes a shuffle exact in unit tests. A fixed list of draws always gives the same order:

```js
import { createShuffle } from 'fast-shuffle'

const draws = [0.1, 0.7, 0.3, 0.9, 0.5, 0.2, 0.8]
const riggedShuffle = createShuffle(() => draws.shift())
riggedShuffle(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'])
// [ 'A', 'E', 'B', 'G', 'C', 'H', 'F', 'D' ]
```

If the code under test calls `shuffle`, it reads `Math.random` on every call, so a stub of `Math.random` (for example `mock.method(Math, 'random', () => 0.5)` in `node:test`) pins its order too.

The parameters are also curried, so it can be used in [pipelines](https://github.com/tc39/proposal-pipeline-operator).

```js
import { createShuffle } from 'fast-shuffle'

const randomCapitalLetter =
  ['a', 'b', 'c', 'd', 'e', 'f']   // :: () -> [a]
  |> createShuffle(Math.random),       // :: [a] -> [a]
  |> _ => _[0]                     // :: [a] -> a
  |> _ => _.toUpperCase()          // :: a -> a
```

If you give it an array of your source array and a random seed, you'll get a shuffled array and a new random seed back. This is a pure function and the original array is not mutated, so you can use it in your Redux reducers. The returned, shuffled array is a shallow copy, so if you use this in React, [you will often avoid unnecessary rerenders](https://redux.js.org/faq/performance).

```js
import { SHUFFLE_DECK } from './actions'
import { createShuffle } from 'fast-shuffle'

const initialState = {
  ...
  deck: ['♣', '♦', '♥', '♠'],
  randomizer: Date.now()
}

const dealerApp = (state = initialState, action) => {
  switch (action.type) {
    ...
    case SHUFFLE_DECK:
      const [ deck, randomizer ] = createShuffle([state.deck, state.randomizer])
      return {
        ...state,
        deck,
        randomizer,
      }
    ...
    default:
      return state
  }
}
```

## Why not use existing libraries?

1. It doesn't mutate your source array, so it's safe for Redux reducers.

2. The parameters are curried in [the correct order](https://www.youtube.com/watch?v=m3svKOdZijA), so you can use it within `|>` or Ramda pipes.

3. You can make it a deterministic pure function, useful for shuffling in tests.

4. It's stupid-fast and scales to large arrays without breaking a sweat.
