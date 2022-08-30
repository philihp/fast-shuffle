import { newRandGen, randNext, randRange } from 'fn-mt'

type FastShuffleState<T> = [deck: T[], seed: number]

/**
 * This is the algorithm. Random should be a function that when given
 * an integer, returns an integer 0..n. I have a hunch most of the time
 * we will just get a seed, but if you're reading this please tell me
 * if you ever send in your own randomizer :)
 */
const fisherYatesShuffle = (random: (arg: number) => number) => (sourceArray: any[]) => {
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

const randomInt = () => (Math.random() * 2 ** 32) | 0

const randomExternal = (random: () => number) => (maxIndex: number) => ((random() / 2 ** 32) * maxIndex) | 0

const randomInternal = (random: number) => {
  let randState = newRandGen(random)
  return (maxIndex: number) => {
    const [nextInt, nextState] = randRange(0, maxIndex, randState)
    randState = nextState
    return nextInt
  }
}

const randomSwitch = (random: number | (() => number)) =>
  typeof random === 'function' ? randomExternal(random) : randomInternal(random)

const functionalShuffle = <T>(deck: T[], state: number): FastShuffleState<T> => {
  let randState = newRandGen(state)
  const random = (maxIndex: number) => {
    const [nextInt, nextState] = randRange(0, maxIndex, randState)
    randState = nextState
    return nextInt
  }
  return [fisherYatesShuffle(random)(deck), randNext(randState)[0]]
}

function fastShuffle(randomSeed: number | (() => number)): <T>(deck: T[]) => T[]
function fastShuffle<T>(randomSeed: number | (() => number), deck: T[]): T[]
function fastShuffle<T>(fnParams: [deck: T[], randomSeed?: number]): FastShuffleState<T>
function fastShuffle(randomSeed: number | (() => number) | [deck: unknown[], randomSeed?: number], deck?: unknown[]) {
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

export const shuffle = <T>(deck: T[]) => fastShuffle(randomInt(), deck)

export default fastShuffle
