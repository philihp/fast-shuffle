import shuffle from '..'

describe('shuffle', () => {
  it('shuffles the array', () => {
    expect.assertions(2)
    const d1 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    const pseudoRandomNumbers = [0.19, 0.84, 0.02, 0.29, 0.19, 0.85, 0.11, 0.02]
    const d2 = shuffle(d1, () => pseudoRandomNumbers.pop())
    expect(d2).toStrictEqual(expect.arrayContaining(d1))
    expect(d2).toHaveLength(d1.length)
  })

  it('does not mutate the source', () => {
    expect.assertions(1)
    const d1 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    const pseudoRandomNumbers = [0.19, 0.84, 0.02, 0.29, 0.19, 0.85, 0.11, 0.02]
    shuffle(d1, () => pseudoRandomNumbers.pop())
    expect(d1).toMatchObject(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'])
  })

  it('does a shallow clone', () => {
    expect.assertions(4)
    const d1 = [
      { name: 'Alice', money: 10 },
      { name: 'Betty', money: 20 },
      { name: 'Cindy', money: 15 },
    ]
    const pseudoRandomNumbers = [0.19, 0.84, 0.02, 0.29]
    const d2 = shuffle(d1, () => pseudoRandomNumbers.pop())
    // given the numbers above, should be alice, cindy, betty
    expect(d2[0].name).toBe('Alice')
    expect(d2[0].money).toBe(10)
    d2[0].money = 40
    expect(d1[0].name).toBe('Alice')
    expect(d1[0].money).toBe(40)
  })

  it('can be sorted back into the source array', () => {
    expect.assertions(1)
    const d1 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].sort()
    const pseudoRandomNumbers = [0.19, 0.84, 0.02, 0.29, 0.19, 0.85, 0.11, 0.02]
    const d2 = shuffle(d1, () => pseudoRandomNumbers.pop())
    const d3 = d2.sort()
    expect(d3).toMatchObject(d1)
  })

  it('scales calls to random linearly', () => {
    expect.assertions(1)
    const d = new Array(10000)
    const rng = jest.fn()
    shuffle(d, rng)
    expect(rng).toHaveBeenCalledTimes(d.length)
  })

  it('works with massive noise', () => {
    expect.assertions(1)
    const d1 = new Array(500000).fill().map((_, i) => i)
    const d2 = shuffle(d1)
    expect(d1.sort()).toMatchObject(d2.sort())
  })
})
