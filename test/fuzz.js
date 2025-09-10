import assert         from 'node:assert/strict'
import test           from 'node:test'
import * as BitStream from '../src/bitstream.js'


async function main () {

    while (true) {
        
        // TODO: write a fuzz test to read and write arbitrary bit streams

        assert.strictEqual(5, 3 + 2)
    	await delay(1000)
    }
}


async function delay (ms) {
	return new Promise(function (resolve) {
		setTimeout(resolve, ms)
	})
}


main()
