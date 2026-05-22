import { performance } from 'node:perf_hooks'
import { createShuffle, shuffle } from './index.ts'

type BenchResult = {
  name: string
  iterations: number
  totalMs: number
  opsPerSec: number
  nsPerOp: number
}

const bench = (name: string, fn: () => void, durationMs = 1000): BenchResult => {
  for (let i = 0; i < 50; i++) fn()
  const start = performance.now()
  const deadline = start + durationMs
  let iterations = 0
  while (performance.now() < deadline) {
    fn()
    iterations++
  }
  const totalMs = performance.now() - start
  return {
    name,
    iterations,
    totalMs,
    opsPerSec: (iterations * 1000) / totalMs,
    nsPerOp: (totalMs * 1e6) / iterations,
  }
}

const sizes = [10, 100, 1000, 10000]
const seed = 0x12345678

const results: BenchResult[] = []

for (const size of sizes) {
  const deck = Array.from({ length: size }, (_, i) => i)
  const curriedSeeded = createShuffle(seed)
  const curriedExternal = createShuffle(Math.random)

  results.push(bench(`shuffle (size=${size})`, () => shuffle(deck)))
  results.push(bench(`createShuffle(seed) (size=${size})`, () => curriedSeeded(deck)))
  results.push(bench(`createShuffle(Math.random) (size=${size})`, () => curriedExternal(deck)))
  results.push(
    bench(`createShuffle([deck, seed]) functional (size=${size})`, () => createShuffle([deck, seed]))
  )
}

const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 0 })

console.log('\nfast-shuffle benchmark')
console.log('======================\n')
console.log(`Node ${process.version} on ${process.platform}/${process.arch}\n`)

const header = ['name', 'iterations', 'ops/sec', 'ns/op']
const rows = results.map((r) => [r.name, fmt(r.iterations), fmt(r.opsPerSec), fmt(r.nsPerOp)])
const widths = header.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)))
const line = (cells: string[]) =>
  cells.map((c, i) => (i === 0 ? c.padEnd(widths[i]) : c.padStart(widths[i]))).join('  ')
console.log(line(header))
console.log(widths.map((w) => '-'.repeat(w)).join('  '))
for (const row of rows) console.log(line(row))
console.log()
