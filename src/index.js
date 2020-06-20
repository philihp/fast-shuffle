const ruffle = (random) => (deck) => {
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

export const shuffle = ruffle(Math.random)

export default ruffle
