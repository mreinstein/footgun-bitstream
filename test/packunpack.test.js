import assert         from 'node:assert/strict'
import test           from 'node:test'
import * as pack      from '../src/pack.js'
import * as unpack    from '../src/unpack.js'
import random64BigInt from './helpers/random-64-bigint.js'


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


{
    const arr = new Uint8Array(4_000_0960)

    const bigs = [ ]

    for (let i=0; i < 500_000; i++)
      bigs.push(random64BigInt())

    let offsetBits = 0
    for (const b of bigs) {
        offsetBits = pack.uleb128(arr, offsetBits, b)
        pack.uint(arr, offsetBits, 2, 2) // pack 2 bits in between each uleb
        offsetBits += 2
    }

    offsetBits = 0
    for (const b of bigs) {
        const { value, bitsRead } = unpack.uleb128(arr, offsetBits)
        assert.strictEqual(value, b, 'bigints match on unpack')
      
        offsetBits += bitsRead

        // read the 2 bit value padded between each uleb128 to validate offset byte packing works fine
        const uu = unpack.uint(arr, offsetBits, 2)
        offsetBits += 2
    }
}