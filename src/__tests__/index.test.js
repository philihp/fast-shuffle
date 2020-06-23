import { pipe } from 'ramda'
import { newRandGen } from 'fn-mt'
import fastShuffle, { shuffle } from '..'

describe('default', () => {
  it('shuffles the array', () => {
    expect.assertions(2)
    const pseudoShuffle = fastShuffle(12345)
    const d1 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    const d2 = pseudoShuffle(d1)
    expect(d2).toStrictEqual(expect.arrayContaining(d1))
    expect(d2).toHaveLength(d1.length)
  })

  it('does not mutate the source', () => {
    expect.assertions(1)
    const pseudoShuffle = fastShuffle(12345)
    const d1 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    pseudoShuffle(d1)
    expect(d1).toMatchObject(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'])
  })

  it('does a shallow clone', () => {
    expect.assertions(3)
    const pseudoShuffle = fastShuffle(12345)
    const d1 = [
      { name: 'Alice', money: 10 },
      { name: 'Betty', money: 20 },
      { name: 'Cindy', money: 15 },
    ]
    const d2 = pseudoShuffle(d1)
    expect(d2).toContain(d1[0])
    expect(d2).toContain(d1[1])
    expect(d2).toContain(d1[2])
  })

  it('can be sorted back into the source array', () => {
    expect.assertions(1)
    const pseudoShuffle = fastShuffle(12345)
    const d1 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].sort()
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

  it('can be piped as a curried function', () => {
    expect.assertions(1)
    const pseudoShuffle = fastShuffle(12345)
    const letters = () => ['a', 'b', 'c', 'd']
    const head = (array) => array?.[0]
    const drawCard = pipe(letters, pseudoShuffle, head)
    expect(drawCard()).toBe('b')
  })

  it('accepts a custom random function', () => {
    expect.assertions(1)
    const noise = [
      0.8901547130662948,
      0.3163755603600294,
      0.1307072939816823,
      0.1839188123121576,
      0.0397594964593742,
      0.2045602793853012,
      0.8264361317269504,
      0.5677250262815505,
      0.5320779164321721,
      0.5955447026062757,
    ]
    const pseudoShuffle = fastShuffle(() => noise.pop())
    const d1 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    const d2 = pseudoShuffle(d1)
    expect(d1).not.toStrictEqual(d2)
  })

  it('accepts a custom random function that gives floats (0..1)', () => {
    expect.assertions(2)
    const noise = [
      0.8901547130662948,
      0.3163755603600294,
      0.1307072939816823,
      0.1839188123121576,
      0.0397594964593742,
      0.2045602793853012,
      0.8264361317269504,
      0.5677250262815505,
      0.5320779164321721,
      0.5955447026062757,
    ]
    const pseudoShuffle = fastShuffle(() => noise.pop())
    const d1 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    const d2 = pseudoShuffle(d1)
    expect(d1).not.toStrictEqual(d2)
    expect(d1.sort()).toStrictEqual(d2.sort())
  })

  it('also, rather than curried, accepts a seed and the source array', () => {
    expect.assertions(1)
    const d1 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    const d2 = fastShuffle(12345, d1)
    expect(d2).toStrictEqual(['B', 'H', 'F', 'C', 'G', 'A', 'D', 'E'])
  })
})

describe('shuffle', () => {
  it('works with massive noise', () => {
    expect.assertions(1)
    const d1 = new Array(500).fill().map((_, i) => i)
    const d2 = shuffle(d1)
    expect(d1.sort()).toMatchObject(d2.sort())
  })
})

describe('fastShuffle for reducers', () => {
  it('accepts [array, number]', () => {
    expect.assertions(2)
    const d1 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    const [d2, seedState] = fastShuffle([d1, 12345])
    expect(seedState).toBeInstanceOf(Object)
    expect(d2).toStrictEqual(['B', 'H', 'F', 'C', 'G', 'A', 'D', 'E'])
  })

  it('returns different arrays with different seed ints', () => {
    expect.assertions(2)
    const s1 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    const [d1] = fastShuffle([s1, 12345])
    const [d2] = fastShuffle([s1, 67890])
    expect(d1).not.toStrictEqual(d2)
    expect(d1.sort()).toStrictEqual(d2.sort())
  })

  it('accepts [array, object]', () => {
    expect.assertions(4)
    const d1 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    const oldState = newRandGen(12345)
    const [d2, newState] = fastShuffle([d1, oldState])
    expect(oldState).toBeInstanceOf(Object)
    expect(newState).toBeInstanceOf(Object)
    expect(oldState).not.toStrictEqual(newState)
    expect(d2).toStrictEqual(['B', 'H', 'F', 'C', 'G', 'A', 'D', 'E'])
  })

  it('finds its own seed, if not given one', () => {
    expect.assertions(1)
    const s1 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    const [d1] = fastShuffle([s1, undefined])
    expect(s1.every((r) => d1.includes(r))).toBe(true)
  })
})
