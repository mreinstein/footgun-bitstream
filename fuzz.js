import assert         from 'node:assert/strict'
import test           from 'node:test'
import * as BitStream from './src/bitstream.js'
import random64BigInt from './test/helpers/random-64-bigint.js'


async function main () {

    console.log('fuzzing bitstream reading and writing...')

    while (true) {    
        // TODO: write a fuzz test to read and write arbitrary bit streams
        assert.strictEqual(5, 3 + 2)
    	await delay(1000)
    }
}


function fuzzUint64Arr () {
   const arr = new Uint8Array(2048)

   // random tests/fuzzing
   for (let i=0; i < 1_000_000; i++) {
      const r = random64BigInt()
      Pack.uint64(arr, 0, r)
      const unpacked = Unpack.uint64(arr, 0)
      if (unpacked !== r)
           throw new Error(`failed to pack/unpack a random uint64`)
   }
   console.log('uint64 pack/unpack fuzzing passed')
}


async function delay (ms) {
	return new Promise(function (resolve) {
		setTimeout(resolve, ms)
	})
}


main()
