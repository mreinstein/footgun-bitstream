import crypto from 'node:crypto'


// generate a BigInt that fits into a uint64
export default function random64BigInt () {
    const bytes = new Uint8Array(8)
    crypto.getRandomValues(bytes)

    let result = 0n
    for (let i=0n; i < 8n; i++) {
        result = (result << 8n) | BigInt(bytes[i])
    }
    return result
}
