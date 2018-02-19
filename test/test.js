import shuffle from '../index'

describe('shuffle', () => {
  it('shuffles the array', () => {
    const d1 = [ 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H' ]
    let pseudoRandomNumbers = [
      0.19, 0.84, 0.02, 0.29,
      0.19, 0.85, 0.11, 0.02,
    ]
    const d2 = shuffle(d1, () => pseudoRandomNumbers.pop());
    expect(d2).toEqual(expect.arrayContaining(d1))
    expect(d2).toHaveLength(d1.length)
  })

  it('does not mutate the source', () => {
    const d1 = [ 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H' ]
    let pseudoRandomNumbers = [
      0.19, 0.84, 0.02, 0.29,
      0.19, 0.85, 0.11, 0.02,
    ]
    shuffle(d1, () => pseudoRandomNumbers.pop());
    expect(d1).toMatchObject([ 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H' ])
  })

  it('does a shallow clone', () => {
    const d1 = [
      { name: 'Alice', money: 10 },
      { name: 'Betty', money: 20 },
      { name: 'Cindy', money: 15 }
    ]
    let pseudoRandomNumbers = [
      0.19, 0.84, 0.02, 0.29,
    ]
    const d2 = shuffle(d1, () => pseudoRandomNumbers.pop());
    // given the numbers above, should be alice, cindy, betty
    expect(d2[0]['name']).toEqual('Alice')
    expect(d2[0]['money']).toEqual(10)
    d2[0]['money'] = 40
    expect(d1[0]['name']).toEqual('Alice')
    expect(d1[0]['money']).toEqual(40)
  })

  it('can be sorted back into the source array', () => {
    const d1 = [ 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H' ].sort()
    let pseudoRandomNumbers = [
      0.19, 0.84, 0.02, 0.29,
      0.19, 0.85, 0.11, 0.02,
    ]
    const d2 = shuffle(d1, () => pseudoRandomNumbers.pop());
    const d3 = d2.sort();
    expect(d3).toMatchObject(d1);
  })

  it('scales calls to random linearly', () => {
    const d = new Array(10000)
    const rng = jest.fn()
    shuffle(d, rng)
    expect(rng).toHaveBeenCalledTimes(d.length)
  })

  it('works with massive noise', () => {
    const d1 = Array(500000).fill().map((e,i) => i)
    const d2 = shuffle(d1)
    expect(d1.sort()).toMatchObject(d2.sort())
  })

})
