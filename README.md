# Fast Shuffle

![Build Status](https://travis-ci.org/philihp/fast-shuffle.svg?branch=master)

Fast Shuffle is a Fisher-Yates shuffle which relaxes the constraint of
performing the shuffle in-place, and instead guarantees that the source
array will not be mutated. The intent is to provide a shuffle which can
be used in pure function reducers.

By encouraging stateless code with no side effects, testing is easier
and we have more confidence in code correctness.

## Why not use existing libraries?

Many libraries do the shuffle in-place, which is a feature of Fisher-Yates shuffling. The source array can be cloned, but I like this
for the simpler interface.

Other libraries use Array.splice() to remove the element from the
array. This causes the runtime of the shuffle to increase from linear
to quadratic time.

## Optimizations

An easy optimization for this is to swap the last element with the
randomly selected element, and then pop it out. Since we don't care
about preserving the order of the source array, this is fine.

Repeated pop() of the src array and push() of the dst array also causes
extra runtime. Since it is known the final size of the dst array,
initializing it to that size saves time.

Since the loop is already getting fairly tight, the final optimization
that most existing libraries don't do is avoid `Math.floor` by a bitwise
`| 0`.
