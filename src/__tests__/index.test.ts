import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createPcg32, prevState, getOutput, randomInt as pcgRandomInt } from 'pcg'
import { shuffle, createShuffle } from '../index.ts'

const pipe =
  (...fns: Array<(...args: any[]) => any>) =>
  (...args: any[]) =>
    fns.reduce<any>((value, fn, i) => (i === 0 ? fn(...args) : fn(value)), undefined)

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
    assert.equal(rng.mock.callCount(), d.length)
  })

  it('can be piped as a curried function', () => {
    const pseudoShuffle = createShuffle(12345)
    const letters = () => ['a', 'b', 'c', 'd']
    const head = (array: unknown[]) => array?.[0]
    const drawCard = pipe(letters, pseudoShuffle, head)
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

// The shuffle is fully reversible if you have the 64-bit PCG internal state
// after the shuffle: pcg32's LCG step is invertible (pcg exposes prevState),
// so stepping backward recovers every output sample, which recovers every
// Fisher-Yates draw index, which lets us invert the permutation.
//
// Mirrors functionalShuffle in src/index.ts so the captured state matches
// what the library would have used internally.
const SEQUENCE = 12345
type Pcg = ReturnType<typeof createPcg32>

const forwardShuffleCapturingState = <T>(deck: T[], seed: number): { shuffled: T[]; stateFinal: Pcg } => {
  let randState = createPcg32({}, seed, SEQUENCE)
  const random = (maxIndex: number) => {
    const [n, ns] = pcgRandomInt(0, maxIndex, randState)
    randState = ns
    return n
  }
  const clone = deck.slice()
  let sourceIndex = clone.length
  let destinationIndex = 0
  const shuffled = new Array(clone.length)
  while (sourceIndex) {
    const r = random(sourceIndex)
    shuffled[destinationIndex++] = clone[r]
    clone[r] = clone[--sourceIndex]
  }
  // matches the trailing randNext(0, 2**32 - 1, randState) in src/index.ts:51
  const [, stateFinal] = pcgRandomInt(0, 2 ** 32 - 1, randState)
  return { shuffled, stateFinal }
}

const reverseShuffleFromState = <T>(shuffled: T[], stateFinal: Pcg): T[] => {
  const n = shuffled.length
  // Undo the trailing randNext(0, 2**32 - 1): bound = 2**32 so threshold = 0,
  // never rejects, exactly one state advance.
  let s = prevState(stateFinal)

  // Forward Fisher-Yates used bounds n, n-1, ..., 1; reversed it's 1..n.
  const recoveredIndices: number[] = []
  for (let bound = 1; bound <= n; bound++) {
    const threshold = ((2 ** 32 - bound) % bound) >>> 0
    // pcg's randomInt advances state once per sample (accepted or rejected),
    // so step back through any rejected draws to find the accepted one.
    let raw: number
    while (true) {
      s = prevState(s)
      raw = getOutput(s)
      if (raw >= threshold) break
    }
    recoveredIndices.unshift(raw % bound)
  }

  // Replay Fisher-Yates forward on [0..n-1] with the recovered indices to
  // build the permutation, then invert it.
  const idx = Array.from({ length: n }, (_, i) => i)
  const perm = new Array<number>(n)
  let src = n
  let dst = 0
  for (let i = 0; i < n; i++) {
    const r = recoveredIndices[i]
    perm[dst++] = idx[r]
    idx[r] = idx[--src]
  }
  const original = new Array<T>(n)
  for (let i = 0; i < n; i++) original[perm[i]] = shuffled[i]
  return original
}

describe('reversal from full PCG state', () => {
  it('recovers the original deck from the final 64-bit pcg state', () => {
    const deck = ['a', 'b', 'c', 'd', 'e']
    const { shuffled, stateFinal } = forwardShuffleCapturingState(deck, 12345)
    assert.notDeepEqual(shuffled, deck)
    const recovered = reverseShuffleFromState(shuffled, stateFinal)
    assert.deepEqual(recovered, deck)
  })

  it('matches the public createShuffle output, then reverses it', () => {
    const deck = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    const seed = 12345
    const [publicShuffled] = createShuffle([deck, seed])
    const { shuffled, stateFinal } = forwardShuffleCapturingState(deck, seed)
    assert.deepEqual(shuffled, publicShuffled)
    const recovered = reverseShuffleFromState(publicShuffled, stateFinal)
    assert.deepEqual(recovered, deck)
  })

  it('works across a range of deck sizes and seeds', () => {
    for (const seed of [1, 42, 12345, 2 ** 31 - 1, 0xdeadbeef]) {
      for (const n of [1, 2, 7, 16, 52, 100]) {
        const deck = Array.from({ length: n }, (_, i) => `item-${i}`)
        const { shuffled, stateFinal } = forwardShuffleCapturingState(deck, seed)
        const recovered = reverseShuffleFromState(shuffled, stateFinal)
        assert.deepEqual(recovered, deck, `failed for seed=${seed} n=${n}`)
      }
    }
  })
})
