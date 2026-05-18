/**
 * Throughput benchmark across array sizes.
 *
 * For each size, builds an input deck once, then measures each shuffler via
 * tinybench (which auto-tunes iteration count, runs warmup, and reports ops/s
 * with standard error).
 *
 * The input deck is re-used across iterations *without* re-cloning between
 * runs of the same shuffler; this is fair because every shuffler in our set
 * is wrapped to be non-mutating, so a single source deck remains untouched.
 */

import { Bench } from 'tinybench'
import { SHUFFLERS } from './shufflers.ts'

const SIZES = [10, 52, 100, 1_000, 10_000, 100_000]

function makeDeck(n: number): number[] {
  const a = new Array<number>(n)
  for (let i = 0; i < n; i++) a[i] = i
  return a
}

function fmtOps(ops: number): string {
  if (ops >= 1e9) return (ops / 1e9).toFixed(2) + 'B'
  if (ops >= 1e6) return (ops / 1e6).toFixed(2) + 'M'
  if (ops >= 1e3) return (ops / 1e3).toFixed(2) + 'k'
  return ops.toFixed(2)
}

function fmtNs(ns: number): string {
  if (ns >= 1e6) return (ns / 1e6).toFixed(2) + ' ms'
  if (ns >= 1e3) return (ns / 1e3).toFixed(2) + ' µs'
  return ns.toFixed(2) + ' ns'
}

async function runSize(size: number) {
  const deck = makeDeck(size)
  // tinybench defaults: time-based budget. We use both a time budget and a
  // minimum iteration floor so tiny arrays don't get under-sampled.
  const bench = new Bench({
    time: size <= 100 ? 400 : size <= 10_000 ? 700 : 1500,
    iterations: 20,
    warmupTime: 100,
  })

  for (const [name, fn] of Object.entries(SHUFFLERS)) {
    bench.add(name, () => {
      // assign to a sink-style local so JIT can't dead-code-eliminate the call
      const out = fn(deck)
      if (out.length !== size) throw new Error('length mismatch')
    })
  }

  await bench.run()

  // Sort fastest first
  const rows = bench.tasks
    .map((t) => {
      const r = t.result!
      return {
        name: t.name,
        hz: r.throughput.mean, // ops/sec
        meanNs: r.latency.mean * 1e6, // tinybench reports ms; convert to ns
        rmeNs: (r.latency.rme / 100) * r.latency.mean * 1e6,
        samples: r.latency.samplesCount,
      }
    })
    .sort((a, b) => b.hz - a.hz)

  const fastest = rows[0].hz
  const nameWidth = Math.max(...rows.map((r) => r.name.length))

  console.log(`\n=== n = ${size.toLocaleString()} ===`)
  console.log(
    'shuffler'.padEnd(nameWidth) +
      '   ops/sec     '.padStart(16) +
      'mean'.padStart(12) +
      ' ±rme'.padStart(10) +
      '   rel'.padStart(8),
  )
  console.log('-'.repeat(nameWidth + 50))
  for (const r of rows) {
    const rel = r.hz / fastest
    console.log(
      r.name.padEnd(nameWidth) +
        '  ' +
        fmtOps(r.hz).padStart(10) +
        '  ' +
        fmtNs(r.meanNs).padStart(12) +
        '  ±' +
        fmtNs(r.rmeNs).padStart(8) +
        '   ' +
        (rel === 1 ? '1.00x' : rel.toFixed(2) + 'x').padStart(7),
    )
  }
}

;(async () => {
  console.log('Node ' + process.version + ' / V8 ' + process.versions.v8)
  console.log('Platform: ' + process.platform + ' ' + process.arch)
  console.log('CPU: ' + (await import('node:os')).cpus()[0].model)
  console.log('\nMeasuring: time to produce a NEW shuffled array (non-mutating).')
  console.log('Higher ops/sec is better. "rel" is throughput relative to the fastest.')

  for (const size of SIZES) {
    await runSize(size)
  }
})()
