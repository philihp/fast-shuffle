# Fast Shuffle

Fast Shuffle is a fisher-yates shuffle which relaxes the constraint of
performing the shuffle in-place, and instead guarantees that the source
array will not be mutated. The intent is to provide a shuffle which can
be used in pure function reducers.

By encouraging stateless code with no side effects, testing is easier and
we have more confidence in code correctness.
