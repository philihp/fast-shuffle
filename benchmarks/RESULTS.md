# pcg main vs released benchmark

Comparison of `fast-shuffle`'s shuffle pipeline using the released `pcg@2.0.0`
vs the unreleased `pcg` from upstream `main`
(https://github.com/philihp/pcg), pulled at commit `f99c028`.

The unreleased branch contains the BigInt -> Uint64 hi/lo number-arithmetic
rewrite (`perf: replace BigInt math with Uint64 hi/lo number arithmetic`, #337)
plus follow-ups, while not yet being published to npm.

## Environment

- Node v22.22.2
- Linux 6.18.5
- 3 passes per case, with 1k-iteration warmup before each timed loop

## Output equivalence

Sanity check confirmed both versions produce **identical shuffled output** for
the same seed (`seed=42`, 52-card deck) — this is a drop-in perf change.

## Results

Median across 3 passes, `ns/op`:

| Deck size | pcg@2.0.0 (ns/op) | pcg main (ns/op) | Speedup |
|----------:|------------------:|-----------------:|--------:|
|        10 |             8,000 |            2,244 |   3.57x |
|        52 |            37,853 |            9,932 |   3.81x |
|       100 |            71,286 |           18,474 |   3.86x |
|     1,000 |           703,704 |          179,657 |   3.92x |
|    10,000 |         7,100,131 |        1,787,953 |   3.97x |
|   100,000 |        74,899,272 |       20,106,758 |   3.73x |

The unreleased `pcg` is **~3.7-4.0x faster** across every deck size, scaling
roughly linearly with deck size (each shuffle does N random draws). The
speedup is dominated by replacing per-step BigInt arithmetic with Uint64
hi/lo number ops.

## Reproducing

See the comment at the top of `pcg-main-vs-released.mjs` for full
side-by-side install instructions using npm aliases (`pcg-released` /
`pcg-main`).
