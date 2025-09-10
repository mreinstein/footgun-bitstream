import assert      from 'node:assert/strict'
import test        from 'node:test'
import * as pack   from '../src/pack.js'
import * as unpack from '../src/unpack.js'


{
	// writing to the same location overwrites rather than adding
	const msg = new Uint8Array(12)

	let r
    //                 offsetBit  value    bitsToWrite
	r = pack.uint(msg,     0,       2,         8)
	assert.deepStrictEqual(msg, new Uint8Array([ 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]))
	assert.strictEqual(r, 8, 'new offsetBit after writing')

	//                 offsetBit  value    bitsToWrite
	r = pack.uint(msg,     0,       5,         8)
	assert.deepStrictEqual(msg, new Uint8Array([ 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]))
	assert.strictEqual(r, 8, 'new offsetBit after writing')
}


{
	const msg = new Uint8Array(64)

	pack.uint8(msg, 0, 7)
	pack.uint16(msg, 8, 61099)
	pack.uint32(msg, 24, 839162143)

	const testString = 'you bastard'
	pack.str(msg, 56, testString)

	assert.strictEqual(unpack.uint8(msg, 0), 7)
	assert.strictEqual(unpack.uint16(msg, 8), 61099)
	assert.strictEqual(unpack.uint32(msg, 24), 839162143)

	assert.strictEqual(unpack.str(msg, 56), 'you bastard')
}
