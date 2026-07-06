# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [6.2.1] — 2026-07-06

### Fixed

- Republish to restore the README on the npm package page — npmjs.com only refreshes the displayed README on a new version publish, and it was showing "This package does not have a README" for 6.2.0 despite the registry metadata containing valid README content. Also listed `README.md` explicitly in `files` for good measure.

## [6.2.0] — 2026-05-26

### Performance

- Skip the final `random()` call in `fisherYatesShuffle` — the last iteration always returns index 0, so one RNG call per shuffle is now elided ([#858](https://github.com/philihp/fast-shuffle/pull/858)).
- Bump `pcg` to 3.0.0, yielding roughly 1.4x faster seeded shuffles ([#850](https://github.com/philihp/fast-shuffle/pull/850), [#857](https://github.com/philihp/fast-shuffle/pull/857)).

### Changed

- Modernized toolchain: replaced Jest with `node --test`, migrated to ESM-first builds with a CJS compatibility build, switched tsconfig base to `@tsconfig/node24`, dropped the `ramda` dev dependency ([#835](https://github.com/philihp/fast-shuffle/pull/835), [#758](https://github.com/philihp/fast-shuffle/pull/758), [#761](https://github.com/philihp/fast-shuffle/pull/761), [#836](https://github.com/philihp/fast-shuffle/pull/836)).
- Declared a minimum supported Node version in `engines` ([#841](https://github.com/philihp/fast-shuffle/pull/841)).

### Notes

- The skip-final-call optimization does not change the shuffled output for a given seed (since `random(1)` is always `0`), but it does reduce RNG state advancement by one step per shuffle. Consumers reusing the same RNG instance across multiple operations will observe a different RNG state after each shuffle.

## [6.1.1] — 2024-10-28

### Fixed

- Routine dependency maintenance release.

## [6.1.0] — 2023-12-31

### Added

- Minor feature/maintenance release.

## [6.0.1] — 2023-05-10

### Fixed

- Patch release.

## [6.0.0] — 2023-04-19

### Changed

- Major release.

## [5.0.2] — 2022-08-30

## [5.0.1] — 2022-08-01

## [5.0.0] — 2022-08-01

## [4.6.1] — 2022-08-01

## [4.6.0] — 2022-08-01

## [4.5.1] — 2021-09-07

## [4.5.0] — 2021-06-08

## [4.4.0] — 2021-03-10

## [4.3.0] — 2021-02-03

## [4.2.2] — 2020-07-01

## [4.2.1] — 2020-07-01

## [4.2.0] — 2020-06-23

## [4.1.0] — 2020-06-21

## [4.0.0] — 2020-06-20

## [3.0.0] — 2020-05-04

## [2.0.2] — 2020-04-29

## [2.0.1] — 2020-03-20

## [2.0.0] — 2020-03-20

## [1.0.5] — 2019-02-10

## [1.0.4] — 2018-02-19

## [1.0.3] — 2018-02-19

## [1.0.2] — 2018-02-19

## [1.0.1] — 2018-02-19

## [1.0.0] — 2018-02-19

- Initial release.

[Unreleased]: https://github.com/philihp/fast-shuffle/compare/v6.2.0...HEAD
[6.2.0]: https://github.com/philihp/fast-shuffle/compare/v6.1.1...v6.2.0
[6.1.1]: https://github.com/philihp/fast-shuffle/compare/v6.1.0...v6.1.1
[6.1.0]: https://github.com/philihp/fast-shuffle/compare/v6.0.1...v6.1.0
[6.0.1]: https://github.com/philihp/fast-shuffle/compare/v6.0.0...v6.0.1
[6.0.0]: https://github.com/philihp/fast-shuffle/compare/v5.0.2...v6.0.0
[5.0.2]: https://github.com/philihp/fast-shuffle/compare/v5.0.1...v5.0.2
[5.0.1]: https://github.com/philihp/fast-shuffle/compare/v5.0.0...v5.0.1
[5.0.0]: https://github.com/philihp/fast-shuffle/compare/v4.6.1...v5.0.0
[4.6.1]: https://github.com/philihp/fast-shuffle/compare/v4.6.0...v4.6.1
[4.6.0]: https://github.com/philihp/fast-shuffle/compare/v4.5.1...v4.6.0
[4.5.1]: https://github.com/philihp/fast-shuffle/compare/v4.5.0...v4.5.1
[4.5.0]: https://github.com/philihp/fast-shuffle/compare/v4.4.0...v4.5.0
[4.4.0]: https://github.com/philihp/fast-shuffle/compare/v4.3.0...v4.4.0
[4.3.0]: https://github.com/philihp/fast-shuffle/compare/v4.2.2...v4.3.0
[4.2.2]: https://github.com/philihp/fast-shuffle/compare/v4.2.1...v4.2.2
[4.2.1]: https://github.com/philihp/fast-shuffle/compare/v4.2.0...v4.2.1
[4.2.0]: https://github.com/philihp/fast-shuffle/compare/v4.1.0...v4.2.0
[4.1.0]: https://github.com/philihp/fast-shuffle/compare/v4.0.0...v4.1.0
[4.0.0]: https://github.com/philihp/fast-shuffle/compare/v3.0.0...v4.0.0
[3.0.0]: https://github.com/philihp/fast-shuffle/compare/v2.0.2...v3.0.0
[2.0.2]: https://github.com/philihp/fast-shuffle/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/philihp/fast-shuffle/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/philihp/fast-shuffle/compare/v1.0.5...v2.0.0
[1.0.5]: https://github.com/philihp/fast-shuffle/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/philihp/fast-shuffle/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/philihp/fast-shuffle/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/philihp/fast-shuffle/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/philihp/fast-shuffle/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/philihp/fast-shuffle/releases/tag/v1.0.0
