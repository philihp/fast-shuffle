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

Then call it from your code

```js
import { shuffle } from 'fast-shuffle'

const suits = ['♣', '♦', '♥', '♠']
const faces = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']
const sortedDeck = suits.map((suit) => faces.map((face) => face + suit))

const shuffledDeck = shuffle(sortedDeck)
```

The default export allows you to specify your own random seed, which makes it deterministic and safe for use in redux reducers. `Math.random` doesn't allow you to specify a deterministic seed, but this uses its own built-in Mersenne-Twister RNG. If you had your own source of entropy, you can give that as a function as well.

```js
import fastShuffle from 'fast-shuffle'

const shuffle = fastShuffle(12345)

const state = {
  deck: sortedDeck
  bet: 100,
  dealer: []
  player: []
  ...
}

const newState = {
  ...state,
  deck: shuffle(state.deck)
}
```

Since the parameters are curried, it can be used in [pipelines](https://github.com/tc39/proposal-pipeline-operator).

```js
import fastShuffle from 'fast-shuffle'

const randomLetter =
  ['a', 'b', 'c', 'd']             // :: () -> [a]
  |> fastShuffle(Math.random),     // :: [a] -> [a]
  |> (array) => array[0]           // :: [a] -> a
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
