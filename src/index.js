import MersenneTwister from 'mersenne-twister'

const randomFunction = (random) => {
  if (typeof random === 'function') {
    return random
  }
  const Randomizer = new MersenneTwister(random)
  return () => Randomizer.random()
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
