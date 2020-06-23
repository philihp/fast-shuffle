# Fast Shuffle

[![Version](https://badge.fury.io/js/fast-shuffle.svg)](https://www.npmjs.com/package/fast-shuffle)
![Tests](https://github.com/philihp/fast-shuffle/workflows/tests/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/philihp/fast-shuffle/badge.svg?branch=master)](https://coveralls.io/github/philihp/fast-shuffle?branch=master)
![License](https://img.shields.io/npm/l/fast-shuffle)

A fast and side-effect free array shuffle that's safe for functional programming, and use within Redux reducers.

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

The named `shuffle` export seen above uses `Math.random` for entropy. If you import it without the brackets, you'll get a deterministic shuffler which takes a number for its random seed (e.g. `Date.now()`).

```js
import shuffle from 'fast-shuffle'

const letters = ['a', 'b', 'c', 'd', 'e']
const shuffleRed = shuffle(12345)
shuffleRed(letters) // [ 'a', 'b', 'c', 'd', 'e' ]
shuffleRed(letters) // [ 'a', 'd', 'b', 'e', 'c' ]
shuffleRed(letters) // [ 'c', 'a', 'e', 'b', 'd' ]
shuffleRed(letters) // [ 'b', 'c', 'e', 'a', 'd' ]

const shuffleBlue = shuffle(12345)
shuffleBlue(letters) // [ 'a', 'b', 'c', 'd', 'e' ]
shuffleBlue(letters) // [ 'a', 'd', 'b', 'e', 'c' ]
shuffleBlue(letters) // [ 'c', 'a', 'e', 'b', 'd' ]
shuffleBlue(letters) // [ 'b', 'c', 'e', 'a', 'd' ]
```

The parameters are also curried, so it can be used in [pipelines](https://github.com/tc39/proposal-pipeline-operator).

```js
import shuffle from 'fast-shuffle'

const randomCapitalLetter =
  ['a', 'b', 'c', 'd', 'e', 'f']   // :: () -> [a]
  |> shuffle(Math.random),         // :: [a] -> [a]
  |> _ => _[0]                     // :: [a] -> a
  |> _ => _.toUpperCase()          // :: a -> a
```

If you give it an array of your array and a random seed, you'll get a shuffled array and a new random seed back. This is a pure function, so you can use it in your Redux reducers.

```js
import { SHUFFLE_DECK } from './actions'
import shuffle from 'fast-shuffle'

const initialState = {
  ...
  randomizer: Date.now(),
  deck: ['♣', '♦', '♥', '♠']
}

const dealerApp = (state = initialState, action) => {
  switch (action.type) {
    ...
    case SHUFFLE_DECK:
      const [ deck, randomizer ] = shuffle([state.deck, state.randomizer])
      return {
        ...state,
        randomizer,
        deck
      }
    ...
    default:
      return state
  }
}
```

Shuffle doesn't mutate the original array, instead it gives you back a shallow copy. This is important for React and [performance reasons](https://redux.js.org/faq/performance).

## Why not use existing libraries?

1. It doesn't mutate your source array, so it's safe for Redux reducers.

2. The parameters are curried in [the correct order](https://www.youtube.com/watch?v=m3svKOdZijA), so you can use it within `|>` or Ramda pipes.

3. It's stupid-fast and scales to large arrays without breaking a sweat.

4. You can BYO-RNG.
