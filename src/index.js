import { newRandGen, randRange } from 'fn-mt'

/**
 * This is the basic algorithm. Random should be a function that when given
 * an integer, returns an integer 0..n; basically "give me a random index for
 * my array. I have a hunch most of the time we will just get a seed, and should
 * generate our own random function. Unfortunately Javascript does not let us
 * seed the Math.random randomizer, so this uses fn-mt.
 */
const fisherYatesShuffle = (random) => (sourceArray) => {
  const clone = sourceArray.slice(0)
  let sourceIndex = sourceArray.length
  let destinationIndex = 0
  const shuffled = new Array(sourceIndex)

  while (sourceIndex) {
    const randomIndex = random(sourceIndex)
    shuffled[destinationIndex++] = clone[randomIndex]
    clone[randomIndex] = clone[--sourceIndex]
  }

  return shuffled
}

const randomExternal = (random) => (maxIndex) =>
  ((random() / 2 ** 32) * maxIndex) | 0

const randomInternal = (random) => {
  let randState = newRandGen(random)
  return (maxIndex) => {
    const [nextInt, nextState] = randRange(0, maxIndex, randState)
    randState = nextState
    return nextInt
  }
}

const makeRandom = (random) => {
  if (typeof random === 'function') return randomExternal(random)
  return randomInternal(random)
}

const functionalShuffle = (deck, state) => {
  let randState = typeof state !== 'object' ? newRandGen(state) : state
  const random = (maxIndex) => {
    const [nextInt, nextState] = randRange(0, maxIndex, randState)
    randState = nextState
    return nextInt
  }
  return [fisherYatesShuffle(random)(deck), randState]
}

const fastShuffle = (randomSeed, deck) => {
  // if the first param is an object, assume it's a randomizer's state from a previous run
  if (typeof randomSeed === 'object') {
    const [fnDeck, fnState] = randomSeed
    return functionalShuffle(fnDeck, fnState)
  }
  const random = makeRandom(randomSeed)
  const shuffler = fisherYatesShuffle(random)
  // if no second param given, return a curried shuffler
  if (deck === undefined) return shuffler
  return shuffler(deck)
}

export const shuffle = fastShuffle(Math.random)

export default fastShuffle
