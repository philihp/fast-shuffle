/**
 * Microbenchmark: cost of generating ONE random index, isolated from the
 * shuffle algorithm itself. Confirms whether the dominant cost in
 * fast-shuffle's slow path is the PCG random source.
 */

import { Bench } from 'tinybench'
import { createPcg32, randomInt as randNext } from 'pcg'

const SEQUENCE = 12345
const MAX = 1000

let pcgState = createPcg32({}, 42, SEQUENCE)
const pcgRand = (maxIndex: number) => {
  const [n, s] = randNext(0, maxIndex, pcgState)
  pcgState = s
  return n
}

const mathRand = (maxIndex: number) => (Math.random() * maxIndex) | 0

const bench = new Bench({ time: 1000, warmupTime: 200 })
bench.add('Math.random | 0', () => {
  let s = 0
  for (let i = 0; i < 100; i++) s += mathRand(MAX)
  if (s < 0) throw new Error()
})
bench.add('pcg randomInt', () => {
  let s = 0
  for (let i = 0; i < 100; i++) s += pcgRand(MAX)
  if (s < 0) throw new Error()
})

await bench.run()
console.log('Cost of 100 random ints in [0, 1000):\n')
for (const t of bench.tasks.sort((a, b) => b.result!.throughput.mean - a.result!.throughput.mean)) {
  const r = t.result!
  const meanNs = r.latency.mean * 1e6
  console.log(
    t.name.padEnd(20) +
      '  ' +
      (r.throughput.mean / 1e3).toFixed(2).padStart(8) +
      'k ops/s   ' +
      (meanNs / 100).toFixed(1) +
      ' ns / call',
  )
}
