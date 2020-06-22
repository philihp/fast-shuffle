import { newRandGen, randRange } from 'fn-mt'

const randomFunction = (random) => {
  if (typeof random === 'function') {
    return (maxIndex) => {
      const nextNumber = random()
      if (Number.isInteger(nextNumber)) {
        return ((nextNumber / 2 ** 32) * maxIndex) | 0
      }
      return (nextNumber * maxIndex) | 0
    }
  }
  let randState = newRandGen(random)
  return (maxIndex) => {
    const [nextInt, nextState] = randRange(0, maxIndex, randState)
    randState = nextState
    return nextInt
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
      const randomIndex = random(sourceIndex)
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
