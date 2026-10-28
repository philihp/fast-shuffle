// Checks the ES module build against expected.json.
import { strict as assert } from 'assert'
import { createRequire } from 'module'
import * as lib from '../../dist/index.js'

const require = createRequire(import.meta.url)
const { fingerprint } = require('./checks.cjs')

assert.deepEqual(JSON.parse(JSON.stringify(fingerprint(lib))), require('./expected.json'))
console.log(`ESM build matches expected.json on Node ${process.version}`)
