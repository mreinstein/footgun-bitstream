
/**
 * Packs `bitsToWrite` bits from `value` into `byteArray` at `offsetBits`.
 * @param {Uint8Array|number[]} byteArray   - The array where bits will be stored.
 * @param {number} offsetBits               - The current bit offset in `byteArray`.
 * @param {number} value                    - The unsigned integer value to pack.
 * @param {number} bitsToWrite              - Number of bits from `value` to store.
 * @returns {number}                        - The new bit offset after writing.
 */
export function uint (byteArray, offsetBits, value, bitsToWrite) {
  let remaining = bitsToWrite;
  let currentOffset = offsetBits;
  let localValue = value;

  while (remaining > 0) {
    // Which byte index and bit index within that byte
    const byteIndex = currentOffset >>> 3; // = Math.floor(currentOffset / 8)
    const bitIndex = currentOffset & 7;    // = currentOffset % 8

    // How many bits we can fit into the current byte from `bitIndex` to the end of the byte
    const bitsInThisByte = Math.min(remaining, 8 - bitIndex);

    // Create a mask for these bits (e.g., if bitsInThisByte=3, mask=0b111=7)
    const mask = (1 << bitsInThisByte) - 1;

    // Extract the portion of `value` that fits in this chunk (lowest bitsInThisByte bits)
    const bitsValue = localValue & mask;

    // Shift those bits so they line up with `bitIndex`
    const shiftedBits = bitsValue << bitIndex;

    // 1) Clear those bits from the current byte so we can overwrite:
    //    - We need a mask that zeros out exactly the `bitsInThisByte` starting at `bitIndex`.
    //    - Example: if bitIndex=2 and bitsInThisByte=3, we create (mask=0b111=7) << 2 = 0b11100=28.
    //      Then invert it (~) to get 0b00011. We'll AND with that to clear only those bits.
    const clearMask = ~(((1 << bitsInThisByte) - 1) << bitIndex);
    byteArray[byteIndex] &= clearMask;

    // 2) Now OR in the new bits
    byteArray[byteIndex] |= shiftedBits;

    // Discard the bits we've just stored
    localValue >>>= bitsInThisByte;

    // Advance our offsets
    currentOffset += bitsInThisByte;
    remaining -= bitsInThisByte;
  }

  return currentOffset;
}


/**
 * unsigned LEB128 (Little Endian Base-128)
 * 
 * packs an arbitrarily large integer into a variable number of bytes.
 * Instead of writing 8 bytes for a 64-bit integer, it writes as many bytes
 * as needed to cover the significant bits.
 *
 * Each byte carries 7 bits of payload and 1 continuation flag:
 *   * bits 0-6: the next 7 bits of the number
 *   * bit 7 (the most significant bit): set to 1 if more bytes follow, 0 if this is the last byte
 *
 * This makes it "base-128" (since each chunk carries 7 bits = values 0-12)
 *
 * @param {Uint8Array|number[]} byteArray   - The array where bits will be stored.
 * @param {number} offsetBits               - The current bit offset in `byteArray`.
 * @param {BigInt} num                      - The unsigned integer value to pack.
 * @returns Number The new bit offset after writing
 */
export function uleb128 (arr, offsetBits, num) {
    do {
        let byte = Number(num & 0x7Fn)
        num >>= 7n
        if (num !== 0n)
            byte |= 0x80   // v has remaining significant bits, set the continuation flag

        uint8(arr, offsetBits, byte)
        offsetBits += 8
    } while (num !== 0n)

   return offsetBits
}


export function uint8 (arr, offsetBits, num) {
    const bitsToWrite = 8
    uint(arr, offsetBits, num, bitsToWrite)
}


export function uint16 (arr, offsetBits, num) {
    const bitsToWrite = 16
    uint(arr, offsetBits, num, bitsToWrite)
}


export function uint32 (arr, offsetBits, num) {
    const bitsToWrite = 32
    uint(arr, offsetBits, num, bitsToWrite)
}


export function uint64 (arr, offsetBits, num) {
    for (let i=0; i < 8; i++) {
        uint8(arr, offsetBits, Number(num & 0xFFn))
        offsetBits += 8
        num >>= 8n
    }
}


// pack a utf-8 string
// @return Number how many bits were used to pack the string
export function str (arr, offsetBits, val) {

    if (!val) {
        uint16(arr, offsetBits, 0)
        return 16
    }

    // use 16 bits to store string length
    if (val.length > 65535)
        throw new Error(`Can't pack string with more than 65535 characters.`)
 
    const e = (new TextEncoder()).encode(val)
        
    uint16(arr, offsetBits, e.byteLength)
    offsetBits += 16
    for (let i=0; i < e.byteLength; i++)
        uint8(arr, offsetBits + (i * 8), e[i])

    return 16 + (e.byteLength * 8)
}


const scratch = new DataView(new ArrayBuffer(8))


/**
 * Packs a 16-bit float (IEEE 754) into the provided byte array at the given bit offset.
 * Internally breaks the float into 2 bytes, then stores each byte with 8 bits.
 *
 * @param {Uint8Array|number[]} byteArray   - The array where bits will be stored.
 * @param {number} offsetBits               - The current bit offset in `byteArray`.
 * @param {number} float16Value             - The JS number (float16) to pack.
 * @param {boolean} [littleEndian=true]     - Whether to store in little-endian format.
 * @returns {number} - The new bit offset after writing 16 bits.
 */
export function float16 (byteArray, offsetBits, float16Value, littleEndian = true) {
  // Write the float16 into the DataView
  scratch.setFloat16(0, float16Value, littleEndian)

  let offset = offsetBits

  // Each of the 2 bytes is 8 bits
  for (let i = 0; i < 2; i++) {
    // getUint8(i) retrieves one byte
    const byte = scratch.getUint8(i)
    offset = uint(byteArray, offset, byte, 8)
  }

  return offset;
}


/**
 * Packs a 32-bit float (IEEE 754) into the provided byte array at the given bit offset.
 * Internally breaks the float into 4 bytes, then stores each byte with 8 bits.
 *
 * @param {Uint8Array|number[]} byteArray   - The array where bits will be stored.
 * @param {number} offsetBits               - The current bit offset in `byteArray`.
 * @param {number} float32Value             - The JS number (float32) to pack.
 * @param {boolean} [littleEndian=true]     - Whether to store in little-endian format.
 * @returns {number} - The new bit offset after writing 32 bits.
 */
export function float32 (byteArray, offsetBits, float32Value, littleEndian = true) {
  // Write the float32 into the DataView
  scratch.setFloat32(0, float32Value, littleEndian)

  let offset = offsetBits

  // Each of the 4 bytes is 8 bits
  for (let i = 0; i < 4; i++) {
    // getUint8(i) retrieves one byte
    const byte = scratch.getUint8(i)
    offset = uint(byteArray, offset, byte, 8)
  }

  return offset;
}


/**
 * Packs a 64-bit float (IEEE 754) into the provided byte array at the given bit offset.
 * Internally breaks the float into 8 bytes, then stores each byte with 8 bits.
 *
 * @param {Uint8Array|number[]} byteArray   - The array where bits will be stored.
 * @param {number} offsetBits               - The current bit offset in `byteArray`.
 * @param {number} float64Value             - The JS number (float64) to pack.
 * @param {boolean} [littleEndian=true]     - Whether to store in little-endian format.
 * @returns {number} - The new bit offset after writing 64 bits.
 */
export function float64 (byteArray, offsetBits, float64Value, littleEndian = true) {

  // Write the float64 into the DataView
  scratch.setFloat64(0, float64Value, littleEndian)

  let offset = offsetBits

  // Each of the 8 bytes is 8 bits
  for (let i = 0; i < 8; i++) {
    // getUint8(i) retrieves one byte
    const byte = scratch.getUint8(i)
    offset = uint(byteArray, offset, byte, 8)
  }

  return offset;
}

