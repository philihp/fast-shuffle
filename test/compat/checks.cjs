// A fingerprint of every entry point's output, in plain JavaScript with no
// dependencies, so the built package can be checked on old Node versions
// that the toolchain itself cannot run on.

const fingerprint = (lib) => {
  const { shuffle, createShuffle } = lib
  const deck = (n) => Array.from({ length: n }, (_, i) => i)
  const replay = (draws) => {
    const remaining = draws.values()
    return () => remaining.next().value
  }

  const seeds = [0, 1, -1, 12345, 2 ** 32, 1761523200000, Number.MAX_SAFE_INTEGER]
  const sizes = [0, 1, 2, 5, 52]

  const seeded = seeds.map((seed) => {
    const shuffler = createShuffle(seed)
    return {
      seed,
      curried: sizes.map((n) => [shuffler(deck(n)), shuffler(deck(n)), shuffler(deck(n))]),
      uncurried: createShuffle(seed, deck(52)),
      functional: createShuffle([deck(52), seed]),
    }
  })

  const integerDraws = deck(51).map((i) => (i * 2654435761) >>> 0)
  const floatDraws = deck(51).map((i) => ((i * 7) % 16) / 16)

  // shuffle draws from Math.random at call time, so a stub pins its order
  const realRandom = Math.random
  const stubbed = (() => {
    Math.random = replay(floatDraws)
    try {
      return shuffle(deck(52))
    } finally {
      Math.random = realRandom
    }
  })()

  const frozen = Object.freeze(deck(52).map((card) => ({ card })))
  const before = JSON.stringify(frozen)
  const shuffledFrozen = createShuffle(7, frozen)

  return {
    seeded,
    integerRandomizer: createShuffle(replay(integerDraws))(deck(52)),
    floatRandomizer: createShuffle(replay(floatDraws))(deck(52)),
    stubbedMathRandom: stubbed,
    defaultExport: JSON.stringify(lib.default(12345, deck(52))) === JSON.stringify(createShuffle(12345, deck(52))),
    frozenInputUnchanged: JSON.stringify(frozen) === before && shuffledFrozen !== frozen,
    sparse: createShuffle(99, [1, , 3, , 5]),
    typed: createShuffle(99, new Uint8Array([1, 2, 3, 4, 5])),
  }
}

module.exports = { fingerprint }
