import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { createPcg32, nextState, prevState, getOutput } from 'pcg'
import { shuffle, createShuffle } from '../index.ts'

describe('default', () => {
  it('shuffles the array', () => {
    const pseudoShuffle = createShuffle(12345)
    const d1 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    const d2 = pseudoShuffle(d1)
    for (const item of d1) assert.ok(d2.includes(item))
    assert.equal(d2.length, d1.length)
  })

  it('does not mutate the source', () => {
    const pseudoShuffle = createShuffle(12345)
    const d1 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    pseudoShuffle(d1)
    assert.deepEqual(d1, ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'])
  })

  it('does a shallow clone', () => {
    const pseudoShuffle = createShuffle(12345)
    const d1 = [
      { name: 'Alice', money: 10 },
      { name: 'Betty', money: 20 },
      { name: 'Cindy', money: 15 },
    ]
    const d2 = pseudoShuffle(d1)
    assert.ok(d2.includes(d1[0]))
    assert.ok(d2.includes(d1[1]))
    assert.ok(d2.includes(d1[2]))
  })

  it('can be sorted back into the source array', () => {
    const pseudoShuffle = createShuffle(12345)
    const d1 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].sort()
    const d2 = pseudoShuffle(d1)
    const d3 = d2.sort()
    assert.deepEqual(d3, d1)
  })

  it('scales calls to random linearly', () => {
    const d = new Array(10000)
    const rng = mock.fn()
    createShuffle(rng)(d)
    assert.equal(rng.mock.callCount(), d.length - 1)
  })

  it('can be piped as a curried function', () => {
    const pseudoShuffle = createShuffle(12345)
    const letters = () => ['a', 'b', 'c', 'd']
    const head = (array: unknown[]) => array?.[0]
    const drawCard = () => head(pseudoShuffle(letters()))
    assert.equal(drawCard(), 'c')
  })

  it('accepts a custom random function', () => {
    const noise = [
      0.8901547130662948, 0.3163755603600294, 0.1307072939816823, 0.1839188123121576, 0.0397594964593742,
      0.2045602793853012, 0.8264361317269504, 0.5677250262815505, 0.5320779164321721, 0.5955447026062757,
    ]
    // @ts-ignore
    const pseudoShuffle = createShuffle(() => noise.pop())
    const d1 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    const d2 = pseudoShuffle(d1)
    assert.notDeepEqual(d1, d2)
  })

  it('accepts a custom random function that gives floats (0..1)', () => {
    const noise = [
      0.8901547130662948, 0.3163755603600294, 0.1307072939816823, 0.1839188123121576, 0.0397594964593742,
      0.2045602793853012, 0.8264361317269504, 0.5677250262815505, 0.5320779164321721, 0.5955447026062757,
    ]
    // @ts-ignore
    const pseudoShuffle = createShuffle(() => noise.pop())
    const d1 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    const d2 = pseudoShuffle(d1)
    assert.notDeepEqual(d1, d2)
    assert.deepEqual(d1.sort(), d2.sort())
  })

  it('also, rather than curried, accepts a seed and the source array', () => {
    const d1 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    const d2 = createShuffle(12345, d1)
    assert.deepEqual(d2, ['C', 'G', 'H', 'B', 'F', 'D', 'E', 'A'])
  })
})

describe('shuffle', () => {
  it('works with massive noise', () => {
    // @ts-ignore
    const d1 = new Array(500).fill().map((_, i) => i)
    const d2 = shuffle(d1)
    assert.deepEqual(d1.sort(), d2.sort())
  })
})

describe('createShuffle for reducers', () => {
  it('accepts [array, number]', () => {
    const d1 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    const [d2, seedState] = createShuffle([d1, 12345])
    assert.notEqual(seedState, undefined)
    assert.deepEqual(d2, ['C', 'G', 'H', 'B', 'F', 'D', 'E', 'A'])
  })

  it('returns different arrays with different seed ints', () => {
    const s1 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    const [d1] = createShuffle([s1, 12345])
    const [d2] = createShuffle([s1, 67890])
    assert.notDeepEqual(d1, d2)
    assert.deepEqual(d1.sort(), d2.sort())
  })

  it('finds its own seed, if not given one', () => {
    const s1 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    const [d1] = createShuffle([s1, undefined])
    assert.ok(s1.every((r) => d1.includes(r)))
  })

  it('nondeterministically seeds, if no seed provided', () => {
    const s1 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    const [d1, r1] = createShuffle([s1, undefined])
    const [d2, r2] = createShuffle([s1, undefined])
    assert.ok(d1.every((r: string) => d2.includes(r)))
    assert.notDeepEqual(r1, r2)
  })
})

describe('reversal from full PCG state', () => {
  it('recovers the original 5-element deck from the final 64-bit pcg state', () => {
    const deck = ['a', 'b', 'c', 'd', 'e']

    let pcg = createPcg32({}, 12345, 67890)
    const rng = () => {
      const u = getOutput(pcg)
      pcg = nextState(pcg)
      return u
    }
    const shuffled = createShuffle(rng)(deck)
    assert.notDeepEqual(shuffled, deck)

    const s3 = prevState(pcg)
    const s2 = prevState(s3)
    const s1 = prevState(s2)
    const s0 = prevState(s1)
    const replayed = [getOutput(s0), getOutput(s1), getOutput(s2), getOutput(s3)]

    let cursor = 0
    const perm = createShuffle(() => replayed[cursor++])([0, 1, 2, 3, 4])

    const recovered = new Array<string>(5)
    perm.forEach((p, i) => {
      recovered[p] = shuffled[i]
    })
    assert.deepEqual(recovered, deck)
  })
})

describe('rng selection', () => {
  it('the default shuffle export uses Math.random (fine for non-adversarial use)', () => {
    const deck = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    const shuffled = shuffle(deck)
    assert.equal(shuffled.length, deck.length)
    assert.deepEqual([...shuffled].sort(), [...deck].sort())
  })

  it('for cryptographically secure shuffles, pass a CSPRNG via createShuffle', () => {
    const cryptoRng = () => randomBytes(4).readUInt32LE(0)
    const deck = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    const shuffled = createShuffle(cryptoRng)(deck)
    assert.equal(shuffled.length, deck.length)
    assert.deepEqual([...shuffled].sort(), [...deck].sort())
  })
})
