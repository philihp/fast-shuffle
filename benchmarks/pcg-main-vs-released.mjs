/**
 * Benchmark: fast-shuffle's shuffle pipeline using the released `pcg`
 * (npm: pcg@2.0.0) versus the unreleased `pcg` from the upstream `main`
 * branch (https://github.com/philihp/pcg).
 *
 * Usage:
 *   1. Clone & build pcg from main:
 *        git clone https://github.com/philihp/pcg.git /tmp/pcg
 *        (cd /tmp/pcg && npm install && npm pack)
 *   2. In a scratch dir, install both side-by-side under npm aliases:
 *        {
 *          "type": "module",
 *          "dependencies": {
 *            "pcg-released": "npm:pcg@2.0.0",
 *            "pcg-main": "file:/tmp/pcg/pcg-2.0.0.tgz"
 *          }
 *        }
 *      npm install
 *   3. Copy this file in and run: node bench.mjs
 */
import { createPcg32 as createPcg32Released, randomInt as randomIntReleased } from 'pcg-released'
import { createPcg32 as createPcg32Main, randomInt as randomIntMain } from 'pcg-main'

const SEQUENCE = 12345

const fisherYatesShuffle = (random) => (sourceArray) => {
  const clone = sourceArray.slice(0)
  let sourceIndex = sourceArray.length
  let destinationIndex = 0
  const shuffled = new Array(sourceIndex)
  while (sourceIndex) {
    const randomIndex = random(sourceIndex)
    shuffled[destinationIndex++] = clone[randomIndex]
    clone[randomIndex] = clone[--sourceIndex]
  }
  return shuffled
}

const buildShuffle = (createPcg32, randomInt) => (deck, seed) => {
  let state = createPcg32({}, seed, SEQUENCE)
  const random = (maxIndex) => {
    const [nextInt, nextState] = randomInt(0, maxIndex, state)
    state = nextState
    return nextInt
  }
  return fisherYatesShuffle(random)(deck)
}

const shuffleReleased = buildShuffle(createPcg32Released, randomIntReleased)
const shuffleMain = buildShuffle(createPcg32Main, randomIntMain)

const sanity = () => {
  const deck = Array.from({ length: 52 }, (_, i) => i)
  const a = shuffleReleased(deck, 42)
  const b = shuffleMain(deck, 42)
  const eq = a.length === b.length && a.every((v, i) => v === b[i])
  console.log(`Sanity (same output for seed=42, 52 cards): ${eq ? 'PASS' : 'FAIL'}`)
}

const timeIt = (label, fn, iterations) => {
  for (let i = 0; i < Math.min(iterations, 1000); i++) fn(i)
  const start = process.hrtime.bigint()
  for (let i = 0; i < iterations; i++) fn(i)
  const end = process.hrtime.bigint()
  const ns = Number(end - start)
  const perOp = ns / iterations
  console.log(
    `  ${label.padEnd(18)} ${(ns / 1e6).toFixed(2)} ms total | ${perOp.toFixed(0)} ns/op | ${((1e9 / perOp) | 0).toLocaleString()} ops/sec`,
  )
  return perOp
}

const runSize = (size, iterations) => {
  const deck = Array.from({ length: size }, (_, i) => i)
  console.log(`\nDeck size: ${size}, iterations: ${iterations.toLocaleString()}`)
  const a = timeIt('pcg@2.0.0 (npm)', (i) => shuffleReleased(deck, i + 1), iterations)
  const b = timeIt('pcg main (HEAD)', (i) => shuffleMain(deck, i + 1), iterations)
  const speedup = a / b
  console.log(`  -> main is ${speedup.toFixed(2)}x ${speedup > 1 ? 'FASTER' : 'SLOWER'}`)
}

sanity()

const cases = [
  [10, 200_000],
  [52, 100_000],
  [100, 50_000],
  [1_000, 10_000],
  [10_000, 1_000],
  [100_000, 100],
]

const PASSES = 3
for (let pass = 1; pass <= PASSES; pass++) {
  console.log(`\n========== Pass ${pass}/${PASSES} ==========`)
  for (const [size, iter] of cases) runSize(size, iter)
}
