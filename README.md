# footgun-bitstream
A bit oriented stream for packing and unpacking to a `Uint8Array`.

Useful for networking stuff, probably.


features:
* does not generate memory garbage
* data oriented design that doesn't hide stuff from you
* unit tests
* no dependencies
* supports a lot of field types
* simple implementation, a few hundred lines
* no bounds checking bullshit to slow things down, handle your own business


# example
```javascript
import * as BitStream from '@footgun/bitstream'

// Optionally pass in a Uint8array you'd like to read/write to.
// if you don't pass one, a 1024 Uint8Array is created by default
const s = BitStream.create(new Uint8Array(2048))

// s is now initialized to a data structure you can read/write to.
// s.buf is the uint8array backing store
// s.offsetBits is the pointer to the next bit position the stream will read or write from.
//              it's incremented automatically as you rad or write.

BitStream.write.uint8(s, 20) // write the number 28 as a uint8 to the stream
BitStream.write.float32(s, -49.02334976196289)
BitStream.write.uint(s, 5, 3)  // write the number 5 as a 3 bit uint to the stream

// at this point s.offsetBits is set to 43 because that's how many bits we've written

BitStream.reset(s)  // this resets the stream's offsetBits value back to 0

console.log(BitStream.read.uint8(s))    // prints 20
console.log(BitStream.read.float32(s))  // prints -49.02334976196289
console.log(BitStream.read.uint(s, 3))  // prints 5
```


# measuring stream bit size without allocating

Some times it's useful to know how many bits a given stream would pack to without allocating or writing the data.
You can achieve this with the `measure` operations:

```javascript
const s = BitStream.create(new Uint8Array(0)) // don't need any bytes allocated

BitStream.measure.uint8(s, 36)
BitStream.measure.uint(s, 12, 6)
BitStream.measure.str(s, "hello there, I'm a utf-8 string :o")

// at this point, s.buf is [], and s.offsetBits is 302 
```


# references

Some of the original packing functions were derived from https://github.com/binaryjs/js-binarypack/blob/master/lib/binarypack.js
