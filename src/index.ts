import { createPcg32, randomInt as randNext } from 'pcg'

const SEQUENCE = 12345

type FastShuffleState<T> = [deck: T[], seed: number]

// A seeded random function: given n, an unbiased integer 0..n-1. The shuffle
// calls it once per item, so it keeps the current pcg state and moves it on
// with every draw; that is the one binding here that has to change.
const createRandom = (seed: number) => {
  let randState = createPcg32({}, seed, SEQUENCE)
  return (maxIndex: number): number => {
    const [nextInt, nextState] = randNext(0, maxIndex, randState)
    randState = nextState
    return nextInt
  }
}

/**
 * Your own randomizer: either a float in [0, 1), like `Math.random`, or an
 * unsigned 32-bit integer in [0, 2^32), like most seeded generators.
 */
type RandomFunction = () => number

/**
 * This is the algorithm. Random should be a function that when given
 * an integer n, returns an integer 0..n-1. I have a hunch most of the time
 * we will just get a seed, but if you're reading this please tell me
 * if you ever send in your own randomizer :)
 *
 * It shuffles one copy in place, swapping each pick to the end, so the picks
 * come out last-first. Reversing them gives the same order, for the same
 * random draws, as earlier versions gave.
 */
const fisherYatesShuffle =
  (random: (arg: number) => number) =>
  <T>(sourceArray: readonly T[]): T[] => {
    const shuffled = [...sourceArray]
    let sourceIndex = shuffled.length

    while (sourceIndex > 1) {
      const randomIndex = random(sourceIndex--)
      const swap = shuffled[sourceIndex]
      shuffled[sourceIndex] = shuffled[randomIndex]
      shuffled[randomIndex] = swap
    }

    return shuffled.reverse()
  }

const randomInt = () => (Math.random() * 2 ** 32) | 0

// reads Math.random at call time, so a test can still stub it
const randomMath = (maxIndex: number) => (Math.random() * maxIndex) | 0

const randomExternal = (random: RandomFunction) => (maxIndex: number) => {
  const value = random()
  return ((value < 1 ? value : value / 2 ** 32) * maxIndex) | 0
}

const randomSwitch = (random: number | RandomFunction) =>
  typeof random === 'function' ? randomExternal(random) : createRandom(random)

const functionalShuffle = <T>(deck: readonly T[], state: number): FastShuffleState<T> => {
  const random = createRandom(state)
  return [fisherYatesShuffle(random)(deck), random(2 ** 32 - 1)]
}

function fastShuffle(randomSeed: number | RandomFunction): <T>(deck: readonly T[]) => T[]
function fastShuffle<T>(randomSeed: number | RandomFunction, deck: readonly T[]): T[]
function fastShuffle<T>(fnParams: readonly [deck: readonly T[], randomSeed?: number]): FastShuffleState<T>
function fastShuffle(
  randomSeed: number | RandomFunction | readonly [deck: readonly unknown[], randomSeed?: number],
  deck?: readonly unknown[]
) {
  if (typeof randomSeed === 'object') {
    const fnDeck = randomSeed[0]
    const fnState = randomSeed[1] ?? randomInt()
    return functionalShuffle(fnDeck, fnState)
  }
  const random = randomSwitch(randomSeed)
  const shuffler = fisherYatesShuffle(random)
  // if no second param given, return a curried shuffler
  if (deck === undefined) return shuffler
  return shuffler(deck)
}

const mathRandomShuffle = fisherYatesShuffle(randomMath)

/**
 * Shuffles with `Math.random`. For a repeatable shuffle, use `createShuffle`
 * with a seed or your own randomizer.
 */
export const shuffle = <T>(deck: readonly T[]): T[] => mathRandomShuffle(deck)

export const createShuffle = fastShuffle

/** @deprecated use `createShuffle` */
export default fastShuffle
