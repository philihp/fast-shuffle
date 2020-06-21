# Fast Shuffle

[![Version](https://badge.fury.io/js/fast-shuffle.svg)](https://www.npmjs.com/package/fast-shuffle)
![Tests](https://github.com/philihp/fast-shuffle/workflows/tests/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/philihp/fast-shuffle/badge.svg?branch=master)](https://coveralls.io/github/philihp/fast-shuffle?branch=master)
![License](https://img.shields.io/npm/l/fast-shuffle)

A fast and side-effect free array shuffle that's safe for functional
programming, and use within Redux reducers. The parameters are properly curried as
well, so you can pass it in with Ramda pipes.

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

The shuffle export uses `Math.random` for entropy. You can use the default
export and specify your own seed, which makes it deterministic pure function.

```js
import fastShuffle from 'fast-shuffle'

const letters = ['a', 'b', 'c', 'd', 'e']
let pseudoShuffle = fastShuffle(12345)

pseudoShuffle(letters) // [ 'e', 'd', 'a', 'c', 'b' ]
pseudoShuffle(letters) // [ 'a', 'e', 'c', 'b', 'd' ]

pseudoShuffle = fastShuffle(12345)
pseudoShuffle(letters) // [ 'e', 'd', 'a', 'c', 'b' ]
pseudoShuffle(letters) // [ 'a', 'e', 'c', 'b', 'd' ]
```

For [performance reasons](https://redux.js.org/faq/performance), it doesn't mutate the original array. Instead, it returns a shallow copy so downstream your React components will know not
to rerender themselves. Since it's a pure function and does not mutate the input, you can use
it in your Redux reducers.

```js
import { SHUFFLE_DECK } from './actions'
import fastShuffle from 'fast-shuffle'
import MersenneTwister from 'mersenne-twister'

const initialState = {
  ...
  tSeed: new MersenneTwister(Math.random() * Date.now()).random_int(),
  deck: ['♣', '♦', '♥', '♠']
}

const dealerApp = (state = initialState, action) => {
  switch (action.type) {
    ...
    case SHUFFLE_DECK:
      return {
        ...state,
        tSeed: new MersenneTwister(state.tSeed).random_int(),
        deck: fastShuffle(state.tSeed)(state.deck)
      }
    ...
    default:
      return state
  }
}
```

The parameters are also curried, so it can be used in [pipelines](https://github.com/tc39/proposal-pipeline-operator).

```js
import fastShuffle from 'fast-shuffle'

const randomCapitalLetter =
  ['a', 'b', 'c', 'd', 'e', 'f']   // :: () -> [a]
  |> fastShuffle(Math.random),     // :: [a] -> [a]
  |> _ => _[0]                     // :: [a] -> a
  |> _ => _.toUpperCase()          // :: a -> a
```

## Why not use existing libraries?

1. It doesn't mutate your source array, so it's safe for Redux reducers.

2. The parameters are curried in [the correct order](https://www.youtube.com/watch?v=m3svKOdZijA), so you can use it within `|>` or Ramda pipes.

3. It's stupid-fast and scales to large arrays without breaking a sweat.

4. You can BYO-RNG.

## Optimizations

- Don't use splice. Removing elements with splice preserves order, and slows
  the shuffle run to quadratic time.
- Avoid repeated pop() and push(). The ultimate size of the output array
  will not change.
- Avoid Math.floor. Remove fractions with a binary or with zero.
