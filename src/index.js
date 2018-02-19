const shuffle = (deck, random = Math.random) => {
  let clone = deck.slice(0)
  let srcIndex = deck.length
  let dstIndex = 0
  let shuffled = new Array(srcIndex)

  while(srcIndex) {
    let randIndex = (srcIndex * random()) | 0
    shuffled[dstIndex++] = clone[randIndex]
    clone[randIndex] = clone[--srcIndex]
  }

  return shuffled
}

export default shuffle;
