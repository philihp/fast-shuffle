// Checks the CommonJS build against expected.json. Run with no arguments to
// check, or with --write (on the newest Node) to record expected.json again.
const assert = require('assert').strict
const { writeFileSync } = require('fs')
const { join } = require('path')
const { fingerprint } = require('./checks.cjs')

const actual = JSON.parse(JSON.stringify(fingerprint(require('../../dist/index.cjs'))))
const file = join(__dirname, 'expected.json')

if (process.argv.includes('--write')) {
  writeFileSync(file, `${JSON.stringify(actual, null, 2)}\n`)
  console.log(`wrote ${file}`)
} else {
  assert.deepEqual(actual, require(file))
  console.log(`CJS build matches expected.json on Node ${process.version}`)
}
