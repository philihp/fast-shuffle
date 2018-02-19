const shuffle = (deck, random = Math.random) => {
  let clone = deck.slice(0)
  let shuffled = []

  while(clone.length) {
      let rIndex = Math.floor(clone.length * random())
      shuffled.push(clone[rIndex])
      clone[rIndex] = clone[clone.length - 1]
      clone.pop()
  }

  return shuffled
}

export default shuffle;
