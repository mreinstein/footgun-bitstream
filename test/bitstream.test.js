import assert         from 'node:assert/strict'
import test           from 'node:test'
import * as BitStream from '../src/bitstream.js'


{
	const s = BitStream.create(new Uint8Array(2048))

    BitStream.write.uint(s, 5, 3) // write a 3 bit uint to the stream
    BitStream.write.float16(s, -70.625)
    BitStream.write.float32(s, 91.34095764160156)
    BitStream.write.uint8(s, 203)

	assert.strictEqual(s.offsetBits, 59, `offsetBits match total bits written to the stream`)

	BitStream.reset(s) // reset the pointer to the beginning of the stream

	assert.strictEqual(s.offsetBits, 0, `offsetBits set back to stream beginning`)

	assert.strictEqual(BitStream.read.uint(s, 3), 5, 'read 3 bit uint')
	assert.strictEqual(BitStream.read.float16(s), -70.625, 'read 16 bit float')
	assert.strictEqual(BitStream.read.float32(s), 91.34095764160156, 'read 32 bit float')
	assert.strictEqual(BitStream.read.uint8(s),203, 'read 8 bit uint')
}
