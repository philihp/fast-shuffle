/**
 * PCG32 (XSH RR) with its 64-bit state held in place in two 32-bit words, so
 * a draw allocates nothing. It produces the same draws as the `pcg`
 * package's `createPcg32({}, seed, STREAM)` followed by repeated
 * `randomInt(0, bound, state)`, so a given seed shuffles the same way it
 * always has.
 */

const STREAM = 12345n

const MASK_32 = 0xffffffffn
const MASK_64 = 0xffffffffffffffffn

// 6364136223846793005, the PCG default multiplier, split into 16-bit pieces
const MULTIPLIER_HI = 0x5851f42d
const MULTIPLIER_LO = 0x4c957f2d
const MULTIPLIER_LO_0 = MULTIPLIER_LO & 0xffff
const MULTIPLIER_LO_1 = MULTIPLIER_LO >>> 16

const INCREMENT = ((STREAM << 1n) | 1n) & MASK_64
const INCREMENT_HI = Number(INCREMENT >> 32n)
const INCREMENT_LO = Number(INCREMENT & MASK_32)

/**
 * Returns a function that, given a bound, returns an unbiased integer in
 * [0, bound). Seeding goes through BigInt exactly as `pcg` does, so any seed
 * `pcg` accepts is accepted here, and any it rejects is rejected.
 */
export const createRandom = (seed: number) => {
  const initial = (INCREMENT + BigInt(seed)) & MASK_64
  // [hi, lo]. A typed array, because a closure variable that holds a number
  // too big for a small integer (2^31 in Node, 2^30 in Chrome) becomes a new
  // heap object each time it changes, and the state changes on every draw.
  const state = new Uint32Array([Number(initial >> 32n), Number(initial & MASK_32)])

  // state = state * MULTIPLIER + INCREMENT (mod 2^64); the stores wrap to 32 bits
  const step = () => {
    const hi = state[0]
    const lo = state[1]
    const a0 = lo & 0xffff
    const a1 = lo >>> 16
    const p01 = a0 * MULTIPLIER_LO_1
    const p10 = a1 * MULTIPLIER_LO_0
    const carry = (((a0 * MULTIPLIER_LO_0) >>> 16) + (p01 & 0xffff) + (p10 & 0xffff)) >>> 16
    const productHi =
      (a1 * MULTIPLIER_LO_1 +
        (p01 >>> 16) +
        (p10 >>> 16) +
        carry +
        Math.imul(lo, MULTIPLIER_HI) +
        Math.imul(hi, MULTIPLIER_LO)) >>>
      0
    const sumLo = (Math.imul(lo, MULTIPLIER_LO) >>> 0) + INCREMENT_LO
    state[0] = productHi + INCREMENT_HI + (sumLo > 0xffffffff ? 1 : 0)
    state[1] = sumLo
  }

  const output = () => {
    const hi = state[0]
    const lo = state[1]
    const rotation = hi >>> 27
    const xorLo = ((lo >>> 18) | (hi << 14)) ^ lo
    const xorHi = (hi >>> 18) ^ hi
    const word = ((xorLo >>> 27) | (xorHi << 5)) >>> 0
    return ((word >>> rotation) | (word << (-rotation & 31))) >>> 0
  }

  // a draw below the threshold is rejected and replaced by the next one;
  // fewer than half of all draws are rejected, so the recursion stays shallow
  const atLeast = (threshold: number, draw: number): number => {
    if (draw >= threshold) return draw
    const redraw = output()
    step()
    return atLeast(threshold, redraw)
  }

  step()

  return (bound: number) => {
    const draw = output()
    step()
    // the rejection threshold, 2^32 mod bound, is always below bound, so a
    // draw at or above bound is accepted without computing it
    const accepted = draw < bound ? atLeast((2 ** 32 - bound) % bound, draw) : draw
    // accepted % bound, without the float modulo V8 falls back to for a draw
    // at or above 2^31; the quotient of two integers below 2^32 floors exactly
    return accepted - Math.floor(accepted / bound) * bound
  }
}
