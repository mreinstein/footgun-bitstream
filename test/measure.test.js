import assert         from 'node:assert/strict'
import test           from 'node:test'
import * as BitStream from '../src/bitstream.js'


{
	const s = BitStream.create(new Uint8Array(0)) // don't need any bytes allocated

	BitStream.measure.uint8(s, 36)
	BitStream.measure.uint(s, 12, 6)
	BitStream.measure.str(s, "hello there, I'm a utf-8 string :o")

	assert.deepStrictEqual(s.buf, new Uint8Array(0))
	assert.strictEqual(s.offsetBits, 302)
}

