import { expect, assert } from 'chai'
import shuffle from '../index'

describe('shuffle', () => {
  it('should not lose or duplicate elements', () => {
    const d1 = [ 'A', 'B', 'C', 'D', 'E' ]
    let pesudoRandomNumbers = [
        0.2293,
        0.4043,
        0.8293,
        0.3170,
        0.2581,
    ]
    const d2 = shuffle(d1, () => pesudoRandomNumbers.pop());
    assert.includeMembers(d2, d1, 'all of original elements should be included in output')
    assert.lengthOf(d2, d1.length, 'length of array should not change')
  });
})
