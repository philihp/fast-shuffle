/**
 * Collection of shuffle implementations for benchmarking.
 *
 * Scope: only libraries that NATIVELY return a new array and do not mutate
 * the caller's input. Libraries whose public API mutates the input array
 * (knuth-shuffle, shuffle-array's default mode, d3-array's shuffle/shuffler,
 * hand-rolled in-place Fisher-Yates) are out of scope — wrapping them in
 * an external `slice()` would mix the library's cost with a copy the
 * library doesn't actually do for you.
 */

import { shuffle as fastShuffle, createShuffle as fastCreateShuffle } from '../src/index.ts'
import _ from 'lodash'
import arrayShuffle from 'array-shuffle'

export type Shuffler = <T>(arr: T[]) => T[]

/** fast-shuffle, default non-deterministic export (PCG seeded from Math.random). */
export const fastShuffleMath: Shuffler = (arr) => fastShuffle(arr)

/** fast-shuffle with a numeric seed (deterministic PCG path). */
export const fastShuffleSeeded: Shuffler = (() => {
  const s = fastCreateShuffle(12345) as <T>(d: T[]) => T[]
  return s
})()

/**
 * fast-shuffle fed an external RNG. The library divides the supplied value
 * by 2**32, so we must return a positive float in [0, 2**32), NOT a signed
 * 32-bit int from `| 0`.
 */
export const fastShuffleExternal: Shuffler = (() => {
  const s = fastCreateShuffle(() => Math.random() * 2 ** 32) as <T>(d: T[]) => T[]
  return s
})()

/** Lodash _.shuffle — internally clones, returns a new array. */
export const lodashShuffle: Shuffler = (arr) => _.shuffle(arr)

/**
 * array-shuffle (Sindre Sorhus). The default export is `arrayToShuffled`
 * which does `arrayShuffle([...array])` — non-mutating. The named
 * `arrayShuffle` export mutates and is NOT what we import here.
 */
export const sindreArrayShuffle: Shuffler = (arr) => arrayShuffle(arr)

export const SHUFFLERS: Record<string, Shuffler> = {
  'fast-shuffle (Math.random)': fastShuffleMath,
  'fast-shuffle (seeded PCG)': fastShuffleSeeded,
  'fast-shuffle (external rand)': fastShuffleExternal,
  'lodash.shuffle': lodashShuffle,
  'array-shuffle (Sindre)': sindreArrayShuffle,
}
