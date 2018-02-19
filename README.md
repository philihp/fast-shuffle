# Fast Shuffle

![Build Status](https://travis-ci.org/philihp/fast-shuffle.svg?branch=master) [![npm version](https://badge.fury.io/js/fast-shuffle.svg)](https://badge.fury.io/js/fast-shuffle)

Fast Shuffle is a Fisher-Yates shuffle which relaxes the constraint of
performing the shuffle in-place, and instead guarantees that the source
array will not be mutated.

The intent is to provide a shuffle with a simple interface for pure function
Redux reducers. By encouraging stateless code with no side effects, testing
is easier and we have more confidence in code correctness.

## Usage

```
npm install --save fast-shuffle
```

Then call it from your code

```js
import shuffle from 'fast-shuffle'

const suits = ['♣','♦','♥','♠']
const faces = ['2','3','4','5','6','7','8','9','T','J','Q','K','A']
const sortedDeck = suits.map(suit => faces.map(face => face + suit))

const shuffledDeck = shuffle(sortedDeck)
```

By giving it a pseudoRNG, you can also safely use it in your redux reducers.

```js
import MersenneTwister from 'mersenne-twister'
const prng = new MersenneTwister(12345)

const state = {
  deck: sortedDeck
  bet: 100,
  dealer: []
  player: []
  ...
}

const newState = {
  ...state,
  deck: shuffle(state.deck, prng.random)
}
```

## Why not use existing libraries?

Many libraries do the shuffle in-place, which is a feature of Fisher-Yates
shuffling. The source array can be cloned, but I like this for the simpler
interface.

Other libraries use Array.splice() to remove the element from the
array. This causes the runtime of the shuffle to increase from linear
to quadratic time.

## Optimizations

* Don't use splice. Removing elements with splice preserves order, which is
  very expensive and unnecessary.
* Avoid repeated pop() and push(). The ultimate size of the output array
  will not change.
* Avoid Math.floor. Remove fractions with a binary or with zero.
