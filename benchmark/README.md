# fast-shuffle benchmarks

Throughput, correctness, and RNG-cost benchmarks comparing `fast-shuffle`
to twelve other shuffle approaches.

## Running

```sh
npm install
npm run bench              # throughput across sizes (10 → 100k)
npm run bench:correctness  # bias check (chi-square on length-6 deck)
npm run bench:rng          # PCG vs Math.random per-call cost
```

Latest captured runs:

- [`RESULTS.txt`](./RESULTS.txt) — throughput on Node 22 / Xeon @ 2.10GHz
- [`CORRECTNESS.txt`](./CORRECTNESS.txt) — permutation + chi-square uniformity
- [`RNG-COST.txt`](./RNG-COST.txt) — random-number generator microbench

## Contenders

| key                                | algorithm                                              | RNG                          |
| ---------------------------------- | ------------------------------------------------------ | ---------------------------- |
| `fast-shuffle (Math.random)`       | this package, `shuffle()` export                       | PCG seeded from `Math.random`|
| `fast-shuffle (seeded PCG)`        | this package, `createShuffle(12345)`                   | PCG (deterministic)          |
| `fast-shuffle (external rand)`     | this package, `createShuffle(() => Math.random()*2^32)`| `Math.random` (float)        |
| `Fisher-Yates in-place + slice`    | classic in-place FY, `slice()` then mutate             | `Math.random`                |
| `Fisher-Yates inline (alg only)`   | the exact algorithm fast-shuffle uses, inlined         | `Math.random`                |
| `sort(() => rand - 0.5)`           | naive (and biased) `Array.prototype.sort`              | `Math.random`                |
| `Schwartzian (map-sort-map)`       | decorate–sort–undecorate                               | `Math.random`                |
| `lodash.shuffle`                   | Fisher-Yates                                           | `Math.random`                |
| `knuth-shuffle`                    | Fisher-Yates (mutating, wrapped in `slice()`)          | `Math.random`                |
| `array-shuffle (Sindre)`           | Fisher-Yates                                           | `Math.random`                |
| `shuffle-array (copy:true)`        | Fisher-Yates                                           | `Math.random`                |
| `d3-array shuffle`                 | Fisher-Yates (mutating, wrapped in `slice()`)          | `Math.random`                |
| `d3-array shuffler(Math.random)`   | Fisher-Yates with injected RNG                         | `Math.random`                |

Every wrapper is **non-mutating**: each call produces a freshly allocated
shuffled array. Libraries that mutate are wrapped in `arr.slice()` to make
the comparison apples-to-apples.

## Headline findings

### 1. Both `fast-shuffle` paths are ~100× slower than every alternative

On a 1,000-element deck, Node 22:

| shuffler                          | ops/sec | mean    | rel    |
| --------------------------------- | ------- | ------- | ------ |
| d3-array shuffler(Math.random)    | 128k    | 8.2 µs  | 1.00x  |
| Fisher-Yates in-place + slice     | 126k    | 8.7 µs  | 0.98x  |
| lodash.shuffle                    | 107k    | 9.8 µs  | 0.83x  |
| fast-shuffle (external rand)      | 79k     | 13.6 µs | 0.62x  |
| `fast-shuffle (seeded PCG)`       | **908** | 1.11 ms | 0.01x  |
| `fast-shuffle (Math.random)`      | **895** | 1.13 ms | 0.01x  |

The same ratio holds at every size from 10 to 100,000.

### 2. The RNG is the entire cost

`benchmark/rng-cost.ts` isolates the random source:

```
Math.random | 0          1.54M ops/s     7.5 ns / call
pcg randomInt            10.0k ops/s   1053.0 ns / call
```

The Fisher-Yates loop itself is trivial. Every step of `pcg.randomInt`
goes through:

- `long` (a 64-bit BigInt-emulation library from before native `BigInt`),
- `ramda`'s `curry`,
- and an immutable `{...pcg, state: newState}` spread that allocates a
  fresh PCG state object on every call.

So a length-N shuffle allocates ≈N PCG state objects, on top of the
~1µs/call generator cost. That's where the 100× factor comes from.

### 3. The non-deterministic `shuffle()` export is paying for PCG it doesn't need

`shuffle(deck)` calls `fastShuffle(randomInt(), deck)`. `randomInt()` is
`(Math.random() * 2 ** 32) | 0` — a single Math.random call — but that
int is then used to seed a PCG, and every subsequent index comes out of
the PCG. So the Math.random-backed path pays the full PCG cost even
though the user only asked for non-deterministic shuffling.

A one-line fix would route the non-deterministic path through the
external-RNG branch with `Math.random` directly, bringing it in line
with lodash and the rest.

### 4. `sort(() => rand - 0.5)` is both slow *and* biased

Chi-square on a length-6 deck (expected ≈ 25):

```
sort(() => rand - 0.5)  [biased]     104,631   ← failed
Schwartzian (map-sort-map)               17.3
lodash.shuffle                           25.2
fast-shuffle (Math.random)               47.9
```

Everything except the comparator-randomized sort sits near the
expected value. The comparator approach is widely posted on Stack
Overflow but is non-uniform *and* O(n log n) on top.

### 5. Best in class

For new code where determinism isn't required:

- **d3-array `shuffler(Math.random)`** and **classic Fisher-Yates +
  `slice()`** tie for fastest, with **lodash.shuffle** within ~20%.
- For large arrays (100k+) **array-shuffle**, **d3-array**, and the
  hand-rolled in-place version are within a couple of percent of each
  other.

For deterministic / seedable shuffles, the cheapest correct option is a
hand-rolled Fisher-Yates with a fast seedable PRNG (e.g. mulberry32 or
sfc32 — under 5 ns/call). The existing `pcg` dependency is the
bottleneck, not the algorithm.
