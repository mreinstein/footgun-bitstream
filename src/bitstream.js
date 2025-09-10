import * as pack   from './pack.js'
import * as unpack from './unpack.js'
export * as pack   from './pack.js'
export * as unpack from './unpack.js'


export function create (buf) {
	return {
		buf: buf || new Uint8Array(1024),
		offsetBits: 0, // current bit offset being read/written
	}
}


export function reset (stream) {
	stream.offsetBits = 0
}


export const read = {
	uint: function (stream, bitsToRead) {
		stream.offsetBits += bitsToRead
		return unpack.uint(stream.buf, stream.offsetBits - bitsToRead, bitsToRead)
	},
    uleb128: function (stream) {
        const { value, bitsRead } = unpack.uleb128(stream.buf, stream.offsetBits)
        stream.offsetBits += bitsRead
        return value
    },
	uint8: function (stream) {
		const bitsToRead = 8
		stream.offsetBits += bitsToRead
		return unpack.uint(stream.buf, stream.offsetBits - bitsToRead, bitsToRead)
	},
	uint16: function (stream) {
		const bitsToRead = 16
		stream.offsetBits += bitsToRead
		return unpack.uint(stream.buf, stream.offsetBits - bitsToRead, bitsToRead)
	},
	uint32: function (stream) {
		const bitsToRead = 32
		stream.offsetBits += bitsToRead
		return unpack.uint(stream.buf, stream.offsetBits - bitsToRead, bitsToRead)
	},
    // read a BitIntU64
    uint64: function (stream) {
        const num = unpack.uint64(stream.buf, stream.offsetBits)
        stream.offsetBits += 64
        return num
    },

	float16: function (stream) {
		const bitsToRead = 16
		stream.offsetBits += bitsToRead
		return unpack.float16(stream.buf, stream.offsetBits - bitsToRead)
	},
	float32: function (stream) {
		const bitsToRead = 32
		stream.offsetBits += bitsToRead
		return unpack.float32(stream.buf, stream.offsetBits - bitsToRead)
	},
	float64: function (stream) {
		const bitsToRead = 64
		stream.offsetBits += bitsToRead
		return unpack.float64(stream.buf, stream.offsetBits - bitsToRead)
	},
    str: function (stream) {
        const str = unpack.str(stream.buf, stream.offsetBits)
        if (str === null) {
            stream.offsetBits += 16
            return null
        }

        stream.offsetBits += (16 + str.length * 8) 
        return str;
    },

	// might be nice to be able to send/receive arrays not aligned on byte boundaries
	arr: function (stream, byteCount) {
		const bitsToRead = 8
		const dest = new Uint8Array(byteCount)
		for (let i=0; i < byteCount; i++) {
			dest[i] = unpack.uint(stream.buf, stream.offsetBits, bitsToRead)
			stream.offsetBits += bitsToRead
		}
		return dest
	}
}


export const write = {
	uint: function (stream, num, bitsToWrite) {
		pack.uint(stream.buf, stream.offsetBits, num, bitsToWrite)
		stream.offsetBits += bitsToWrite
	},
    uleb128: function (stream, num) {
        stream.offsetBits = pack.uleb128(stream.buf, stream.offsetBits, num)
    },
	uint8: function (stream, num) {
		const bitsToWrite = 8
		pack.uint(stream.buf, stream.offsetBits, num, bitsToWrite)
		stream.offsetBits += bitsToWrite
	},
	uint16: function (stream, num) {
		const bitsToWrite = 16
		pack.uint(stream.buf, stream.offsetBits, num, bitsToWrite)
		stream.offsetBits += bitsToWrite
	},
	uint32: function (stream, num) {
		const bitsToWrite = 32
		pack.uint(stream.buf, stream.offsetBits, num, bitsToWrite)
		stream.offsetBits += bitsToWrite
	},
    uint64: function (stream, num) {
        pack.uint64(stream.buf, stream.offsetBits, num)
        stream.offsetBits += 64
    },
	float16: function (stream, num) {
		pack.float16(stream.buf, stream.offsetBits, num)
		stream.offsetBits += 16
	},
	float32: function (stream, num) {
		pack.float32(stream.buf, stream.offsetBits, num)
		stream.offsetBits += 32
	},
	float64: function (stream, num) {
		pack.float64(stream.buf, stream.offsetBits, num)
		stream.offsetBits += 64
	},
    str: function (stream, val) {
        stream.offsetBits += pack.str(stream.buf, stream.offsetBits, val)
    },
	arr: function (stream, src, byteCount) {
		const bitsToWrite = 8
		for (let i=0; i < byteCount; i++) {
			pack.uint(stream.buf, stream.offsetBits, src[i], bitsToWrite)
			stream.offsetBits += 8
		}
	},
}

export const measure = {
	uint: function (stream, num, bitsToWrite) {
		stream.offsetBits += bitsToWrite
	},
    uleb128: function (stream, num) {
       do {
           num >>= 7n
           stream.offsetBits += 8
       } while (num !== 0n)
    },
	uint8: function (stream, num) {
		stream.offsetBits += 8
	},
	uint16: function (stream, num) {
		stream.offsetBits += 16
	},
	uint32: function (stream, num) {
		stream.offsetBits += 32
	},
    uint64: function (stream, num) {
        stream.offsetBits += 64
    },
	float16: function (stream, num) {
		stream.offsetBits += 16
	},
	float32: function (stream, num) {
		stream.offsetBits += 32
	},
	float64: function (stream, num) {
		stream.offsetBits += 64
	},
    str: function (stream, val) {

        // use 16 bits to store string length
        stream.offsetBits += 16
        if (!val)
             return

        // limited to the size of the int storing string length (16 bits)
        if (val.length > 65535)
            throw new Error(`Can't pack string with more than 65535 characters.`)
 
        const e = (new TextEncoder()).encode(val)
       
        stream.offsetBits += (e.byteLength * 8)
    },
	arr: function (stream, src, byteCount) {
            console.log('packing uint64', num, 'typeof:', typeof num)
        return byteCount * 8
	},
}
