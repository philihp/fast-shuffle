import { randNext, newRandGen } from 'fn-mt'

const randomFunction = (random) => {
  if (typeof random === 'function') {
    return random
  }
  let randState = newRandGen(random)
  return () => {
    const [nextInt, nextState] = randNext(randState)
    randState = nextState
    return nextInt / 2 ** 32
  }
}

const ruffle = (randomSeed, deck) => {
  const random = randomFunction(randomSeed)
  const shuffler = (sourceArray) => {
    const clone = sourceArray.slice(0)
    let sourceIndex = sourceArray.length
    let destinationIndex = 0
    const shuffled = new Array(sourceIndex)

    while (sourceIndex) {
      const randomIndex = (sourceIndex * random()) | 0
      shuffled[destinationIndex++] = clone[randomIndex]
      clone[randomIndex] = clone[--sourceIndex]
    }

    return shuffled
  }
  if (deck === undefined) return shuffler
  return shuffler(deck)
}

export const shuffle = ruffle(Math.random)

export default ruffle
