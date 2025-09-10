import assert         from 'node:assert/strict'
import test           from 'node:test'
import * as BitStream from './src/bitstream.js'
import random64BigInt from './test/helpers/random-64-bigint.js'


async function main () {

    // TODO: fix uint and str generators, they don't create usable values
    const generators = {
        //'uint': randUint,
        'uint8': randUint8,
        'uint16': randUint16,
        'uint32': randUint32,
        'uint64': randUint64,
        'uleb128': randULEB128,
        'float16': randFloat16,
        'float32': randFloat32,
        'float64': randFloat64,
        //'str': randString,
        'arr': randArr,
    }

    const types = Object.keys(generators)

    let count = 0
    while (true) {
        console.log('testing stream', count++)

        // make up some format of a stream to write, read
        const fields = [ ] 
        const fieldCount = randomInt(1, 40)
        for (let i=0; i < fieldCount; i++) {
            const t = randomChoice(types)

            const field = { type: t, }

            if (t === 'uint') {
                // uint needs a bit count argument
                field.bits = randomInt(1, 31)
                field.value = generators[t](field.bits)
            } else if (t === 'arr') {
                field.byteLength = randomInt(1, 1024)
                field.value = generators.arr(field.byteLength)
            } else {
                field.value = generators[t]()
            }

            fields.push(field)
        }

        let s = BitStream.create(new Uint8Array(0))

        // measure how large the array needs to be to store this entire stream
        for (const f of fields) {
            if (f.type === 'uint')
                BitStream.measure.uint(s, f.value, f.bits)
            else if (f.type === 'arr')
                BitStream.measure.arr(s, f.value, f.byteLength)
            else
                BitStream.measure[f.type](s, f.value)
        }

        // now that we know how many bits are in the stream, really write it
        s.buf = new Uint8Array(Math.ceil(s.offsetBits/8))
        BitStream.reset(s)
        
        for (const f of fields) {
            if (f.type === 'uint')
                BitStream.write.uint(s, f.value, f.bits)
            else if (f.type === 'arr')
                BitStream.write.arr(s, f.value, f.byteLength)
            else
                BitStream.write[f.type](s, f.value)
        }

        BitStream.reset(s)

        // read from the stream and validate everything unpacks okay
        for (const f of fields) {
            let value

            if (f.type === 'uint')
                value = BitStream.read.uint(s, f.bits)
            else if (f.type === 'arr')
                value = BitStream.read.arr(s, f.byteLength)
            else
                value = BitStream.read[f.type](s)

            if (f.type === 'arr')
                assert.deepStrictEqual(value, f.value, `type ${f.type} matches`)
            else
                assert.strictEqual(value, f.value, `type ${f.type} matches`)
        }

    	//await delay(1000)
    }
}


// choose a number between min and max (inclusive)
function randomInt (min, max) {
    const delta = max - min
    return min + Math.round(Math.random() * delta)
}


function randomChoice (arr) {
    return arr[Math.floor(Math.random() * arr.length)]
}


async function delay (ms) {
	return new Promise(function (resolve) {
		setTimeout(resolve, ms)
	})
}


// Unsigned integers
function randUint (bits) {
  if (bits > 53)
    return BigInt.asUintN(bits, BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)))

  return Math.floor(Math.random() * (1 << bits))
}


function randUint8 () {
  return Math.floor(Math.random() * 0x100)
}


function randUint16 () {
  return Math.floor(Math.random() * 0x10000)
}


function randUint32 () {
    /*
    const u = new Uint32Array(1)
    crypto.getRandomValues(u)
    return u[0] // 0..4294967295
*/
    return randomInt(0, 2 ** 31-1)
    //return 2 ** 31 - 1
  //return Math.floor(Math.random() * 0x100000000) >>> 0
}


function randUint64 () {
  // use BigInt for 64-bit range
  const hi = BigInt(Math.floor(Math.random() * 0x100000000))
  const lo = BigInt(Math.floor(Math.random() * 0x100000000))
  return (hi << 32n) | lo
}


// ULEB128 (arbitrary unsigned BigInt)
function randULEB128 (/*maxBits = 128 */) {
  //const bits = Math.floor(Math.random() * maxBits) + 1
  //return BigInt.asUintN(bits, randUint64()) // quick hack, can scale up if needed
  return random64BigInt()
}


// Floats
function randFloat16 () {
  // generate random 16-bit pattern and decode
  const bits = Math.floor(Math.random() * 0x10000)
  const sign = (bits & 0x8000) ? -1 : 1
  const exp = (bits >> 10) & 0x1F
  const frac = bits & 0x3FF

  if (exp === 0) {
    return sign * frac * Math.pow(2, -24)
  } else if (exp === 0x1F) {
    return frac === 0 ? sign * Infinity : NaN
  }
  return sign * (1 + frac / 1024) * Math.pow(2, exp - 15)
}


function randFloat32 () {
  const buf = new ArrayBuffer(4)
  const view = new DataView(buf)
  view.setUint32(0, Math.floor(Math.random() * 0x100000000))
  return view.getFloat32(0)
}


function randFloat64 () {
  const buf = new ArrayBuffer(8)
  const view = new DataView(buf)
  view.setUint32(0, Math.floor(Math.random() * 0x100000000))
  view.setUint32(4, Math.floor(Math.random() * 0x100000000))
  return view.getFloat64(0)
}


// Unicode strings
function randString (maxLen = 32000) {
  const len = randomInt(1, maxLen)
  let s = ''
  for (let i = 0; i < len; i++) {
    const cp = Math.floor(Math.random() * 0x10FFFF)
    s += String.fromCodePoint(cp)
  }
  return s
}


// Byte arrays
function randArr (len) {
  const arr = new Uint8Array(len)
  for (let i = 0; i < len; i++)
      arr[i] = Math.floor(Math.random() * 256)
  return arr
}


main()
