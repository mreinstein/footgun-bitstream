
/**
 * Unpacks (reads) `bitsToRead` bits from `byteArray` at `offsetBits`.
 * @param {Uint8Array|number[]} byteArray - The array containing packed bits.
 * @param {number} offsetBits             - The current bit offset in `byteArray`.
 * @param {number} bitsToRead             - Number of bits to read.
 * @returns {number}                      - The unsigned integer value read from the bits.
 */
export function uint (byteArray, offsetBits, bitsToRead) {
    let remaining = bitsToRead
    let currentOffset = offsetBits
    let result = 0
    let shift = 0

    while (remaining > 0) {
        const byteIndex = currentOffset >>> 3
        const bitIndex = currentOffset & 7

        if (byteIndex >= byteArray.length)
            throw new Error('Byte array does not contain enough data to read.')

        // How many bits are available in this byte from bitIndex to the end
        const bitsInThisByte = Math.min(remaining, 8 - bitIndex)

        // Create a mask for these bits
        const mask = (1 << bitsInThisByte) - 1

        // Extract the portion of the byte we want
        const bitsValue = (byteArray[byteIndex] >>> bitIndex) & mask

        // Put these bits in the correct position in `result`
        // We build `result` from least significant to most significant bits
        result |= (bitsValue << shift)

        // Advance
        shift += bitsInThisByte
        currentOffset += bitsInThisByte
        remaining -= bitsInThisByte
    }

    return result
}


/**
 * unsigned LEB128 (Little Endian Base-128)
 * 
 * unpacks an arbitrarily large integer fram a variable number of bytes.
 * Instead of reading 8 bytes for a 64-bit integer, it reads as many bytes
 * as needed to cover the significant bits.
 *
 * Each byte carries 7 bits of payload and 1 continuation flag:
 *   * bits 0-6: the next 7 bits of the number
 *   * bit 7 (the most significant bit): set to 1 if more bytes follow, 0 if this is the last byte
 *
 * This makes it "base-128" (since each chunk carries 7 bits = values 0-127)
 *
 @returns Object { value, bitsRead } value is a BigInt
 */
export function uleb128 (arr, offsetBits) {
    let shift = 0n
    let result = 0n

    const originalOffsetBits = offsetBits

    while (true) {
        const byte = BigInt(uint8(arr, offsetBits))
        offsetBits += 8

        result |= (byte & 0x7Fn) << shift

        if ((byte & 0x80n) === 0n)
            break // continuation bit not set, we've reached the end of the int

        shift += 7n
    }

    return { value: result, bitsRead: offsetBits - originalOffsetBits }
}


export function uint8 (arr, offsetBits) {
    const bitsToRead = 8
    return uint(arr, offsetBits, bitsToRead)
}


export function uint16 (arr, offsetBits) {
    const bitsToRead = 16
    return uint(arr, offsetBits, bitsToRead)
}


export function uint32 (arr, offsetBits) {
    const bitsToRead = 32
    return uint(arr, offsetBits, bitsToRead)
}

// read a BigIntU64
export function uint64(arr, offsetBits) {
    let num = 0n

    for (let i=0n; i < 8n; i++) {
        let nextByte = BigInt(uint8(arr, offsetBits)) & 0xFFn
        nextByte <<= (8n * i)
        num |= nextByte
        offsetBits += 8
    }
    return num
}


// unpack a utf-8 encoded string
export function str (arr, offsetBits) {
    const byteIndex = Math.ceil(offsetBits/8)
    if (byteIndex + 2 > arr.byteLength)
        throw new Error('unpackString: out of range')

    const len = uint16(arr, offsetBits)
    offsetBits += 16

    if (len === 0)
        return null

    if (byteIndex + len > arr.byteLength)
        throw new Error('unpackString: invalid length', len)

    const decoder = new TextDecoder('utf-8');
    const u = new Uint8Array(len)
    
    for (let i=0; i < len; i++)
        u[i] = uint8(arr, offsetBits + (i * 8))

    return decoder.decode(u)
}


const scratch = new DataView(new ArrayBuffer(8))


/**
 * Unpacks (reads) a 16-bit float (IEEE 754) from the given byte array at the specified bit offset.
 * Reads 2 bytes in 2 separate 8-bit chunks, then reconstructs the float16 via a DataView.
 *
 * @param {Uint8Array|number[]} byteArray   - The array containing the packed bits.
 * @param {number} offsetBits               - The current bit offset in `byteArray`.
 * @param {boolean} [littleEndian=true]     - Whether the original data was stored in little-endian format.
 * @returns {number}                        - The unpacked JS number (float16).
 */
export function float16 (byteArray, offsetBits, littleEndian = true) {
  
  let offset = offsetBits
  for (let i = 0; i < 2; i++) {
    // Read 16 bits (1 byte) at a time
    const oneByte = uint(byteArray, offset, 8)
    offset += 8
    scratch.setUint8(i, oneByte)
  }

  return scratch.getFloat16(0, littleEndian)
}


/**
 * Unpacks (reads) a 32-bit float (IEEE 754) from the given byte array at the specified bit offset.
 * Reads 4 bytes in 4 separate 8-bit chunks, then reconstructs the float32 via a DataView.
 *
 * @param {Uint8Array|number[]} byteArray   - The array containing the packed bits.
 * @param {number} offsetBits               - The current bit offset in `byteArray`.
 * @param {boolean} [littleEndian=true]     - Whether the original data was stored in little-endian format.
 * @returns {number}                        - The unpacked JS number (float32).
 */
export function float32 (byteArray, offsetBits, littleEndian = true) {
  
  let offset = offsetBits
  for (let i = 0; i < 4; i++) {
    // Read 32 bits (1 byte) at a time
    const oneByte = uint(byteArray, offset, 8)
    offset += 8
    scratch.setUint8(i, oneByte)
  }

  return scratch.getFloat32(0, littleEndian)
}


/**
 * Unpacks (reads) a 64-bit float (IEEE 754) from the given byte array at the specified bit offset.
 * Reads 8 bytes in 8 separate 8-bit chunks, then reconstructs the float64 via a DataView.
 *
 * @param {Uint8Array|number[]} byteArray   - The array containing the packed bits.
 * @param {number} offsetBits               - The current bit offset in `byteArray`.
 * @param {boolean} [littleEndian=true]     - Whether the original data was stored in little-endian format.
 * @returns {number}                        - The unpacked JS number (float64).
 */
export function float64 (byteArray, offsetBits, littleEndian = true) {
  
  let offset = offsetBits
  for (let i = 0; i < 8; i++) {
    // Read 64 bits (1 byte) at a time
    const oneByte = uint(byteArray, offset, 8)
    offset += 8
    scratch.setUint8(i, oneByte)
  }

  return scratch.getFloat64(0, littleEndian)
}
