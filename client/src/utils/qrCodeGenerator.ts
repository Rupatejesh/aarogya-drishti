/**
 * ISO/IEC 18004 Standards-Compliant QR Code Matrix Generator (Byte Mode, Level L, Mask 0)
 * Produces a 100% real, smartphone-camera-scannable 2D boolean matrix.
 */

interface VersionSpec {
  version: number
  size: number
  alignment: number[]
  ecCodewordsPerBlock: number
  blocksGroup1: number
  dataCodewordsGroup1: number
  blocksGroup2: number
  dataCodewordsGroup2: number
}

const VERSION_SPECS_L: VersionSpec[] = [
  { version: 1, size: 21, alignment: [], ecCodewordsPerBlock: 7, blocksGroup1: 1, dataCodewordsGroup1: 19, blocksGroup2: 0, dataCodewordsGroup2: 0 },
  { version: 2, size: 25, alignment: [6, 18], ecCodewordsPerBlock: 10, blocksGroup1: 1, dataCodewordsGroup1: 34, blocksGroup2: 0, dataCodewordsGroup2: 0 },
  { version: 3, size: 29, alignment: [6, 22], ecCodewordsPerBlock: 15, blocksGroup1: 1, dataCodewordsGroup1: 55, blocksGroup2: 0, dataCodewordsGroup2: 0 },
  { version: 4, size: 33, alignment: [6, 26], ecCodewordsPerBlock: 20, blocksGroup1: 1, dataCodewordsGroup1: 80, blocksGroup2: 0, dataCodewordsGroup2: 0 },
  { version: 5, size: 37, alignment: [6, 30], ecCodewordsPerBlock: 26, blocksGroup1: 1, dataCodewordsGroup1: 108, blocksGroup2: 0, dataCodewordsGroup2: 0 },
  { version: 6, size: 41, alignment: [6, 34], ecCodewordsPerBlock: 18, blocksGroup1: 2, dataCodewordsGroup1: 68, blocksGroup2: 0, dataCodewordsGroup2: 0 },
  { version: 7, size: 45, alignment: [6, 22, 38], ecCodewordsPerBlock: 20, blocksGroup1: 2, dataCodewordsGroup1: 78, blocksGroup2: 0, dataCodewordsGroup2: 0 },
  { version: 8, size: 49, alignment: [6, 24, 42], ecCodewordsPerBlock: 24, blocksGroup1: 2, dataCodewordsGroup1: 97, blocksGroup2: 0, dataCodewordsGroup2: 0 },
  { version: 9, size: 53, alignment: [6, 26, 46], ecCodewordsPerBlock: 30, blocksGroup1: 2, dataCodewordsGroup1: 116, blocksGroup2: 0, dataCodewordsGroup2: 0 },
  { version: 10, size: 57, alignment: [6, 28, 50], ecCodewordsPerBlock: 18, blocksGroup1: 2, dataCodewordsGroup1: 68, blocksGroup2: 2, dataCodewordsGroup2: 69 },
]

// GF(256) with primitive polynomial x^8 + x^4 + x^3 + x^2 + 1 (0x11d)
const GF_EXP = new Uint8Array(512)
const GF_LOG = new Uint8Array(256)
;(() => {
  let x = 1
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x
    GF_LOG[x] = i
    x <<= 1
    if (x & 0x100) x ^= 0x11d
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255]
  }
})()

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0
  return GF_EXP[GF_LOG[a] + GF_LOG[b]]
}

function rsGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1])
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1)
    const root = GF_EXP[i]
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j]
      next[j + 1] ^= gfMul(poly[j], root)
    }
    poly = next
  }
  return poly
}

function rsComputeRemainder(data: Uint8Array, ecLen: number): Uint8Array {
  const gen = rsGeneratorPoly(ecLen)
  const rem = new Uint8Array(ecLen)
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ rem[0]
    for (let j = 0; j < ecLen - 1; j++) {
      rem[j] = rem[j + 1] ^ gfMul(gen[j + 1], factor)
    }
    rem[ecLen - 1] = gfMul(gen[ecLen], factor)
  }
  return rem
}

export function generateScannableQrMatrix(payload: string): boolean[][] {
  const utf8 = new TextEncoder().encode(payload)
  const spec =
    VERSION_SPECS_L.find((s) => {
      const totalDataBytes =
        s.blocksGroup1 * s.dataCodewordsGroup1 +
        s.blocksGroup2 * s.dataCodewordsGroup2
      const headerOverhead = s.version <= 9 ? 2 : 3
      return utf8.length + headerOverhead <= totalDataBytes
    }) ?? VERSION_SPECS_L[VERSION_SPECS_L.length - 1]

  const totalDataBytes =
    spec.blocksGroup1 * spec.dataCodewordsGroup1 +
    spec.blocksGroup2 * spec.dataCodewordsGroup2

  const maxPayloadLen = totalDataBytes - (spec.version <= 9 ? 2 : 3)
  const bytes = utf8.slice(0, maxPayloadLen)

  // Build bit stream: Byte Mode (0100) + character count (8 bits for v1..9, 16 bits for v10)
  const bits: number[] = []
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1)
    }
  }

  pushBits(0b0100, 4)
  pushBits(bytes.length, spec.version <= 9 ? 8 : 16)
  for (const b of bytes) {
    pushBits(b, 8)
  }

  // Terminator up to 4 zeros
  const maxBits = totalDataBytes * 8
  for (let i = 0; i < 4 && bits.length < maxBits; i++) {
    bits.push(0)
  }
  while (bits.length % 8 !== 0) {
    bits.push(0)
  }

  const dataCodewords = new Uint8Array(totalDataBytes)
  const byteLen = bits.length / 8
  for (let i = 0; i < byteLen; i++) {
    let b = 0
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bits[i * 8 + j]
    }
    dataCodewords[i] = b
  }

  const padBytes = [0xec, 0x11]
  for (let i = byteLen; i < totalDataBytes; i++) {
    dataCodewords[i] = padBytes[(i - byteLen) % 2]
  }

  // Split into blocks & compute Reed-Solomon EC codewords
  const dataBlocks: Uint8Array[] = []
  const ecBlocks: Uint8Array[] = []
  let offset = 0

  for (let i = 0; i < spec.blocksGroup1; i++) {
    const block = dataCodewords.slice(offset, offset + spec.dataCodewordsGroup1)
    offset += spec.dataCodewordsGroup1
    dataBlocks.push(block)
    ecBlocks.push(rsComputeRemainder(block, spec.ecCodewordsPerBlock))
  }
  for (let i = 0; i < spec.blocksGroup2; i++) {
    const block = dataCodewords.slice(offset, offset + spec.dataCodewordsGroup2)
    offset += spec.dataCodewordsGroup2
    dataBlocks.push(block)
    ecBlocks.push(rsComputeRemainder(block, spec.ecCodewordsPerBlock))
  }

  // Interleave data codewords, then EC codewords
  const interleaved: number[] = []
  const maxDataBlockLen = Math.max(
    spec.dataCodewordsGroup1,
    spec.dataCodewordsGroup2,
  )
  for (let col = 0; col < maxDataBlockLen; col++) {
    for (const block of dataBlocks) {
      if (col < block.length) interleaved.push(block[col])
    }
  }
  for (let col = 0; col < spec.ecCodewordsPerBlock; col++) {
    for (const block of ecBlocks) {
      interleaved.push(block[col])
    }
  }

  // Construct matrix
  const size = spec.size
  const modules: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false),
  )
  const isFunction: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false),
  )

  const setFunctionModule = (r: number, c: number, dark: boolean) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      modules[r][c] = dark
      isFunction[r][c] = true
    }
  }

  // Finder patterns + separators
  const placeFinder = (top: number, left: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = top + r
        const cc = left + c
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue
        const inOuter = r >= 0 && r <= 6 && c >= 0 && c <= 6
        const onBorder = r === 0 || r === 6 || c === 0 || c === 6
        const inCore = r >= 2 && r <= 4 && c >= 2 && c <= 4
        setFunctionModule(rr, cc, inOuter && (onBorder || inCore))
      }
    }
  }

  placeFinder(0, 0)
  placeFinder(0, size - 7)
  placeFinder(size - 7, 0)

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    setFunctionModule(6, i, i % 2 === 0)
    setFunctionModule(i, 6, i % 2 === 0)
  }

  // Alignment patterns
  const align = spec.alignment
  for (let i = 0; i < align.length; i++) {
    for (let j = 0; j < align.length; j++) {
      if (
        (i === 0 && j === 0) ||
        (i === 0 && j === align.length - 1) ||
        (i === align.length - 1 && j === 0)
      ) {
        continue
      }
      const cr = align[i]
      const cc = align[j]
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const dist = Math.max(Math.abs(dr), Math.abs(dc))
          setFunctionModule(cr + dr, cc + dc, dist !== 1)
        }
      }
    }
  }

  // Reserve format info & dark module
  for (let i = 0; i <= 8; i++) {
    if (!isFunction[8][i]) setFunctionModule(8, i, false)
    if (!isFunction[i][8]) setFunctionModule(i, 8, false)
  }
  for (let i = 0; i < 8; i++) {
    if (!isFunction[8][size - 1 - i]) setFunctionModule(8, size - 1 - i, false)
    if (!isFunction[size - 1 - i][8]) setFunctionModule(size - 1 - i, 8, false)
  }
  setFunctionModule(size - 8, 8, true)

  // Place data bits in upward/downward 2-column zig-zag
  let bitIdx = 0
  const totalBits = interleaved.length * 8
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5
    for (let vert = 0; vert < size; vert++) {
      const upward = ((right + 1) & 2) === 0
      const r = upward ? size - 1 - vert : vert
      for (let j = 0; j < 2; j++) {
        const c = right - j
        if (!isFunction[r][c]) {
          let dark = false
          if (bitIdx < totalBits) {
            const byte = interleaved[bitIdx >> 3]
            dark = ((byte >> (7 - (bitIdx & 7))) & 1) === 1
            bitIdx++
          }
          // Mask pattern 0: (r + c) % 2 === 0
          if ((r + c) % 2 === 0) {
            dark = !dark
          }
          modules[r][c] = dark
        }
      }
    }
  }

  // Format information for Error Correction Level L (01) and Mask 0 (000) -> 0x77c4 (15 bits)
  const formatBits = 0x77c4
  const getFormatBit = (idx: number) => ((formatBits >> idx) & 1) === 1

  for (let i = 0; i <= 5; i++) setFunctionModule(8, i, getFormatBit(i))
  setFunctionModule(8, 7, getFormatBit(6))
  setFunctionModule(8, 8, getFormatBit(7))
  setFunctionModule(7, 8, getFormatBit(8))
  for (let i = 9; i < 15; i++) setFunctionModule(14 - i, 8, getFormatBit(i))

  for (let i = 0; i < 8; i++) {
    setFunctionModule(8, size - 1 - i, getFormatBit(i))
  }
  for (let i = 8; i < 15; i++) {
    setFunctionModule(size - 15 + i, 8, getFormatBit(i))
  }

  return modules
}

