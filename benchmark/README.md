# fast-shuffle benchmarks

Throughput, correctness, and RNG-cost benchmarks comparing `fast-shuffle`
to the other npm libraries that share its core promise: **shuffle an
array without mutating the caller's input**.

## Scope: non-mutating libraries only

The original draft of this benchmark compared every popular shuffle
library, wrapping the mutating ones in an external `slice()` so the
output was a new array. That's not a fair comparison: it measures
"fastest mutating implementation + a copy we did ourselves" against
libraries that copy internally as part of their advertised API.

So the scope here is restricted to libraries that natively return a new
array without touching the input:

- [`fast-shuffle`](https://www.npmjs.com/package/fast-shuffle)
- [`lodash.shuffle`](https://www.npmjs.com/package/lodash) — `_.shuffle`
  internally calls `copyArray` before shuffling
- [`array-shuffle`](https://www.npmjs.com/package/array-shuffle) — default
  export is `arrayToShuffled`, which does `arrayShuffle([...array])`
  (the named `arrayShuffle` export mutates and is out of scope here)

Excluded for mutating their input as part of their public API:
`knuth-shuffle`, `shuffle-array` (default mode), `d3-array`'s `shuffle`
and `shuffler(...)`.

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

| key                              | algorithm                                            | RNG                            |
| -------------------------------- | ---------------------------------------------------- | ------------------------------ |
| `fast-shuffle (Math.random)`     | this package, `shuffle()` export                     | PCG seeded from `Math.random`  |
| `fast-shuffle (seeded PCG)`      | this package, `createShuffle(12345)`                 | PCG (deterministic)            |
| `fast-shuffle (external rand)`   | this package, `createShuffle(() => Math.random()*2^32)` | `Math.random` (float)       |
| `lodash.shuffle`                 | Fisher-Yates, internal copy                          | `Math.random`                  |
| `array-shuffle (Sindre)`         | Fisher-Yates over `[...input]`                       | `Math.random`                  |

## Headline findings

### 1. Both `fast-shuffle` PCG paths are ~65× slower than the alternatives

On a 1,000-element deck (Node 22, pcg 2.0.0):

| shuffler                       | ops/sec   | mean     | rel   |
| ------------------------------ | --------- | -------- | ----- |
| array-shuffle (Sindre)         | 103k      | 10.27 µs | 1.00x |
| lodash.shuffle                 | 96k       | 10.98 µs | 0.93x |
| fast-shuffle (external rand)   | 73k       | 14.31 µs | 0.71x |
| `fast-shuffle (seeded PCG)`    | **1.59k** | 634.4 µs | 0.02x |
| `fast-shuffle (Math.random)`   | **1.58k** | 634.8 µs | 0.02x |

The same ratio holds at every size from 10 to 100,000. The
external-RNG path of fast-shuffle (which routes around PCG entirely)
sits at ~60–75% of array-shuffle — the algorithm shape is competitive;
it's the PCG dependency that's the problem.

### 2. The RNG is the entire cost

`benchmark/rng-cost.ts` isolates the random source on pcg 2.0.0:

```
Math.random | 0          1.34M ops/s     8.0 ns / call
pcg randomInt            17.2k ops/s   603.4 ns / call
```

pcg 2.0.0 dropped the `long` and `ramda` runtime dependencies that
weighed down the 1.x line (it's ~1.7× faster per call than 1.x: 1053 ns
→ 603 ns) but it's still ~75× slower than `Math.random` per draw. The
Fisher-Yates loop itself is trivial; the cost is the RNG and the
immutable `{...pcg, state: newState}` spread that allocates a fresh PCG
state object on every call. A length-N shuffle still allocates ≈N PCG
state objects.

### 3. The non-deterministic `shuffle()` export is paying for PCG it doesn't need

`shuffle(deck)` calls `fastShuffle(randomInt(), deck)`. `randomInt()` is
`(Math.random() * 2 ** 32) | 0` — a single `Math.random` call — but
that int is then used to seed a PCG, and every subsequent index comes
out of the PCG. So the Math.random-backed path pays the full PCG cost
even though the user only asked for non-deterministic shuffling.

A one-line fix would route the non-deterministic path through the
external-RNG branch with `Math.random` directly, bringing the default
export in line with lodash and array-shuffle.

### 4. Correctness

Every contender produces a valid permutation, and every chi-square sits
near the expected value of `(k-1)² = 25` on a length-6 deck across
200,000 trials. Nothing in the current contender set is biased; the
bias-vs-uniform story (the classic `sort(() => rand - 0.5)` failure
mode) lives in earlier drafts of this benchmark and isn't reproduced
here, since none of the in-scope libraries fall into that trap.

### 5. Best in class

For new code where determinism isn't required:

- **`array-shuffle`** is fastest at every size, with **`lodash.shuffle`**
  within ~5–10%.
- For large arrays (100k+) the two are within ~5% of each other.
- `fast-shuffle`'s `external rand` path is ~60–75% of array-shuffle; the
  PCG paths are two orders of magnitude behind.

For deterministic / seedable shuffles, the cheapest correct option is a
hand-rolled Fisher-Yates with a fast seedable PRNG (e.g. mulberry32 or
sfc32 — under 5 ns/call). The existing `pcg` dependency is the
bottleneck, not the algorithm.
