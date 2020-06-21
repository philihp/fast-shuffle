import MersenneTwister from 'mersenne-twister'

const ruffle = (randomSeed) => {
  let Randomizer
  let random
  if (typeof randomSeed === 'function') {
    random = () => randomSeed()
  } else {
    Randomizer = new MersenneTwister(randomSeed)
    random = () => Randomizer.random()
  }
  return (deck) => {
    const clone = deck.slice(0)
    let sourceIndex = deck.length
    let destinationIndex = 0
    const shuffled = new Array(sourceIndex)

    while (sourceIndex) {
      const randomIndex = (sourceIndex * random()) | 0
      shuffled[destinationIndex++] = clone[randomIndex]
      clone[randomIndex] = clone[--sourceIndex]
    }

    return shuffled
  }
}

export const shuffle = ruffle(Math.random)

export default ruffle
