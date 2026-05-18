/**
 * Quick sanity + bias check on every shuffler before timing them.
 *
 *  - "permutation?"  the output must be a permutation of the input (same
 *    multiset, same length, original untouched).
 *
 *  - "chi-square"    a uniformity check. With N samples of a length-k array,
 *    expected count of each value in each position is N/k. The Pearson
 *    chi-square statistic over the k×k position-value contingency table
 *    has (k-1)² degrees of freedom. Larger == more biased. A correct,
 *    unbiased shuffle should sit near (k-1)² (the d.o.f.).
 */

import { SHUFFLERS, type Shuffler } from './shufflers.ts'

const TRIALS = 200_000
const DECK_SIZE = 6 // small enough that 200k trials gives ~5500 per cell

function isPermutation(input: number[], output: number[]) {
  if (input.length !== output.length) return false
  const a = input.slice().sort((x, y) => x - y)
  const b = output.slice().sort((x, y) => x - y)
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

function chiSquare(shuffler: Shuffler): { stat: number; dof: number } {
  const k = DECK_SIZE
  const counts: number[][] = Array.from({ length: k }, () => new Array(k).fill(0))
  const base = Array.from({ length: k }, (_, i) => i)
  for (let t = 0; t < TRIALS; t++) {
    const out = shuffler(base) as number[]
    for (let pos = 0; pos < k; pos++) counts[pos][out[pos]]++
  }
  const expected = TRIALS / k
  let stat = 0
  for (let pos = 0; pos < k; pos++) {
    for (let v = 0; v < k; v++) {
      const diff = counts[pos][v] - expected
      stat += (diff * diff) / expected
    }
  }
  return { stat, dof: (k - 1) * (k - 1) }
}

const sample = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

console.log('Correctness + bias check (deck size = 6, 200k trials per shuffler)\n')
console.log('  expected chi-square ≈ dof = ' + (DECK_SIZE - 1) * (DECK_SIZE - 1) + '\n')

const namePad = Math.max(...Object.keys(SHUFFLERS).map((n) => n.length))
console.log('shuffler'.padEnd(namePad) + '  permutation?  chi-square')
console.log('-'.repeat(namePad + 28))

for (const [name, fn] of Object.entries(SHUFFLERS)) {
  const out = fn(sample)
  const okPerm = isPermutation(sample, out as number[])
  const { stat } = chiSquare(fn)
  console.log(
    name.padEnd(namePad) + '  ' + (okPerm ? '   yes      ' : '   NO       ') + '  ' + stat.toFixed(1),
  )
}
