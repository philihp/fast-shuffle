import MersenneTwister from 'mersenne-twister'
import { pipe } from 'ramda'
import fastShuffle, { shuffle } from '..'

const twister = new MersenneTwister(12345)
const noise = (length) => new Array(length).fill().map(() => twister.random())

describe('default', () => {
  it('shuffles the array', () => {
    expect.assertions(2)
    const d1 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

    const noiseBank = noise(8)
    const d2 = fastShuffle(() => noiseBank.pop())(d1)
    expect(d2).toStrictEqual(expect.arrayContaining(d1))
    expect(d2).toHaveLength(d1.length)
  })

  it('does not mutate the source', () => {
    expect.assertions(1)
    const d1 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    const noiseBank = noise(8)
    fastShuffle(() => noiseBank.pop())(d1)
    expect(d1).toMatchObject(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'])
  })

  it('does a shallow clone', () => {
    expect.assertions(4)
    const d1 = [
      { name: 'Alice', money: 10 },
      { name: 'Betty', money: 20 },
      { name: 'Cindy', money: 15 },
    ]
    const noiseBank = noise(4)
    const pseudoShuffle = fastShuffle(() => noiseBank.pop())
    const d2 = pseudoShuffle(d1)
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
    const noiseBank = noise(8)
    const pseudoShuffle = fastShuffle(() => noiseBank.pop())
    const d2 = pseudoShuffle(d1)
    const d3 = d2.sort()
    expect(d3).toMatchObject(d1)
  })

  it('scales calls to random linearly', () => {
    expect.assertions(1)
    const d = new Array(10000)
    const rng = jest.fn()
    fastShuffle(rng)(d)
    expect(rng).toHaveBeenCalledTimes(d.length)
  })
})

describe('shuffle', () => {
  it('works with massive noise', () => {
    expect.assertions(1)
    const d1 = new Array(500000).fill().map((_, i) => i)
    const d2 = shuffle(d1)
    expect(d1.sort()).toMatchObject(d2.sort())
  })

  it('can be piped', () => {
    expect.assertions(1)
    const letters = () => ['a', 'b', 'c', 'd']
    const noiseBank = noise(8)
    const randomShuffle = fastShuffle(() => noiseBank.pop())
    const head = (array) => array?.[0]
    const drawCard = pipe(letters, randomShuffle, head)
    expect(drawCard()).toBe('c')
  })
})
