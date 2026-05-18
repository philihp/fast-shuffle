/**
 * Collection of shuffle implementations for benchmarking.
 *
 * All implementations are NON-MUTATING wrappers: they accept an input array
 * and return a new shuffled array, so we compare apples to apples. For
 * libraries that mutate, we clone first inside the wrapper.
 */

import { shuffle as fastShuffle, createShuffle as fastCreateShuffle } from '../src/index.ts'
import _ from 'lodash'
// @ts-expect-error - knuth-shuffle has no types
import { knuthShuffle } from 'knuth-shuffle'
import arrayShuffle from 'array-shuffle'
// @ts-expect-error - shuffle-array has no types
import shuffleArray from 'shuffle-array'
import { shuffle as d3Shuffle, shuffler as d3Shuffler } from 'd3-array'

export type Shuffler = <T>(arr: T[]) => T[]

/** The library under test: Math.random-backed shuffle. */
export const fastShuffleMath: Shuffler = (arr) => fastShuffle(arr)

/** The library under test with a numeric seed (PCG path). */
export const fastShuffleSeeded: Shuffler = (() => {
  const s = fastCreateShuffle(12345) as <T>(d: T[]) => T[]
  return s
})()

/**
 * The library under test fed an external RNG. The library divides the
 * supplied value by 2**32, so we must return a positive float in [0, 2**32),
 * NOT a signed 32-bit int from `| 0`.
 */
export const fastShuffleExternal: Shuffler = (() => {
  const s = fastCreateShuffle(() => Math.random() * 2 ** 32) as <T>(d: T[]) => T[]
  return s
})()

/** Classic in-place Fisher-Yates, returns a new array via slice() first. */
export const fisherYatesInPlace: Shuffler = (arr) => {
  const out = arr.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0
    const t = out[i]
    out[i] = out[j]
    out[j] = t
  }
  return out
}

/**
 * Same algorithm fast-shuffle uses, but written inline so we can see the
 * pure-algorithm cost without the function-call indirection.
 */
export const fisherYatesInline: Shuffler = (arr) => {
  const clone = arr.slice()
  let sourceIndex = arr.length
  let destinationIndex = 0
  const shuffled = new Array(sourceIndex)
  while (sourceIndex) {
    const randomIndex = (Math.random() * sourceIndex) | 0
    shuffled[destinationIndex++] = clone[randomIndex]
    clone[randomIndex] = clone[--sourceIndex]
  }
  return shuffled
}

/** The naive, INCORRECT (biased), but very common approach. */
export const sortByRandom: Shuffler = (arr) => arr.slice().sort(() => Math.random() - 0.5)

/** Decorate–sort–undecorate (Schwartzian transform); unbiased. */
export const schwartzian: Shuffler = (arr) =>
  arr
    .map((value) => ({ value, key: Math.random() }))
    .sort((a, b) => a.key - b.key)
    .map((p) => p.value)

/** Lodash _.shuffle (Fisher-Yates, returns new array). */
export const lodashShuffle: Shuffler = (arr) => _.shuffle(arr)

/** knuth-shuffle (mutates in place, so we slice() first). */
export const knuthShufflePure: Shuffler = (arr) => knuthShuffle(arr.slice())

/** Sindre Sorhus's array-shuffle. */
export const sindreArrayShuffle: Shuffler = (arr) => arrayShuffle(arr)

/** shuffle-array (mutates in place by default; we ask for a copy). */
export const shuffleArrayPkg: Shuffler = (arr) => shuffleArray(arr, { copy: true })

/** d3-array shuffle (mutates in place, so we slice() first). */
export const d3ShufflePure: Shuffler = (arr) => d3Shuffle(arr.slice())

/** d3-array shuffler with an explicit Math.random instance. */
export const d3ShufflerMathRandom: Shuffler = (() => {
  const fn = d3Shuffler(Math.random)
  return (arr) => fn(arr.slice())
})()

export const SHUFFLERS: Record<string, Shuffler> = {
  'fast-shuffle (Math.random)': fastShuffleMath,
  'fast-shuffle (seeded PCG)': fastShuffleSeeded,
  'fast-shuffle (external rand)': fastShuffleExternal,
  'Fisher-Yates in-place + slice': fisherYatesInPlace,
  'Fisher-Yates inline (alg only)': fisherYatesInline,
  'sort(() => rand - 0.5)  [biased]': sortByRandom,
  'Schwartzian (map-sort-map)': schwartzian,
  'lodash.shuffle': lodashShuffle,
  'knuth-shuffle': knuthShufflePure,
  'array-shuffle (Sindre)': sindreArrayShuffle,
  'shuffle-array (copy:true)': shuffleArrayPkg,
  'd3-array shuffle': d3ShufflePure,
  'd3-array shuffler(Math.random)': d3ShufflerMathRandom,
}
