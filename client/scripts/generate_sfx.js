// Simple WAV generator: creates 3 short SFX tones in client/public/sfx/
// Usage: from repo root run `node client/scripts/generate_sfx.js`

import fs from 'fs'
import path from 'path'

function writeWav(filePath, samples, sampleRate = 22050) {
  const numChannels = 1
  const bitsPerSample = 16
  const byteRate = sampleRate * numChannels * bitsPerSample / 8
  const blockAlign = numChannels * bitsPerSample / 8
  const dataSize = samples.length * 2
  const buf = Buffer.alloc(44 + dataSize)
  let off = 0
  buf.write('RIFF', off); off += 4
  buf.writeUInt32LE(36 + dataSize, off); off += 4
  buf.write('WAVE', off); off += 4
  buf.write('fmt ', off); off += 4
  buf.writeUInt32LE(16, off); off += 4 // subchunk1size
  buf.writeUInt16LE(1, off); off += 2 // PCM
  buf.writeUInt16LE(numChannels, off); off += 2
  buf.writeUInt32LE(sampleRate, off); off += 4
  buf.writeUInt32LE(byteRate, off); off += 4
  buf.writeUInt16LE(blockAlign, off); off += 2
  buf.writeUInt16LE(bitsPerSample, off); off += 2
  buf.write('data', off); off += 4
  buf.writeUInt32LE(dataSize, off); off += 4
  // write samples
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    buf.writeInt16LE(Math.floor(s * 0x7fff), off)
    off += 2
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, buf)
}

function makeSine(freq, duration, sampleRate = 22050, amplitude = 0.6) {
  const len = Math.floor(sampleRate * duration)
  const out = new Float32Array(len)
  for (let i = 0; i < len; i++) {
    out[i] = amplitude * Math.sin(2 * Math.PI * freq * (i / sampleRate))
  }
  return out
}

function makeEnvelope(samples, attack = 0.005, release = 0.03, sampleRate = 22050) {
  const len = samples.length
  const a = Math.floor(attack * sampleRate)
  const r = Math.floor(release * sampleRate)
  for (let i = 0; i < len; i++) {
    let env = 1
    if (i < a) env = i / Math.max(1, a)
    else if (i > len - r) env = (len - i) / Math.max(1, r)
    samples[i] *= env
  }
  return samples
}

const base = path.resolve('client/public/sfx')
const s1 = makeSine(1400, 0.12)
makeEnvelope(s1)
writeWav(path.join(base, 'send.wav'), s1)

const s2 = makeSine(900, 0.11)
makeEnvelope(s2)
writeWav(path.join(base, 'receive.wav'), s2)

// reaction: two quick blips
const r1 = makeSine(700, 0.06)
makeEnvelope(r1, 0.002, 0.02)
writeWav(path.join(base, 'reaction.wav'), r1)

console.log('Generated sample SFX at client/public/sfx: send.wav, receive.wav, reaction.wav')
