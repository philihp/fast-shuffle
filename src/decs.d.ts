declare module 'pcg' {
  type PCGState = any
  const createPcg32: PCGState
  const randomInt: (min: number, max: number, state: PCGState) => [number, PCGState]
}
