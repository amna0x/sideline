// Lightweight SFX helper. Uses AudioContext and attempts to preload short audio files
// from /sfx/*.mp3 (public). If they are missing, it falls back to oscillator tones.
import { useStore } from '../store/index.js'

const ctx = (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) ? new (window.AudioContext || window.webkitAudioContext)() : null
let buffers = {}
const FILES = {
  send: '/sfx/send.mp3',
  receive: '/sfx/receive.mp3',
  reaction: '/sfx/reaction.mp3'
}

function getVolume() {
  try {
    return useStore.getState().sfxVolume ?? 0.8
  } catch {
    return 0.8
  }
}

function enabled() {
  try { return !!useStore.getState().sfxEnabled } catch { return true }
}

async function preload(name) {
  if (!ctx) return
  if (!FILES[name]) return
  if (buffers[name]) return
  try {
    const res = await fetch(FILES[name], { cache: 'no-cache' })
    if (!res.ok) return
    const ab = await res.arrayBuffer()
    const decoded = await ctx.decodeAudioData(ab)
    buffers[name] = decoded
  } catch (e) {
    // ignore — fallback will handle
  }
}

async function playOsc(name) {
  if (!ctx) return
  try {
    const vol = getVolume()
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0.0001, now)
    if (name === 'send') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(1200, now)
      osc.frequency.exponentialRampToValueAtTime(1800, now + 0.08)
      gain.gain.setValueAtTime(vol * 0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
      osc.start(now)
      osc.stop(now + 0.12)
    } else if (name === 'receive') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(800, now)
      osc.frequency.exponentialRampToValueAtTime(1000, now + 0.06)
      gain.gain.setValueAtTime(vol * 0.08, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1)
      osc.start(now)
      osc.stop(now + 0.1)
    } else if (name === 'reaction') {
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(600, now)
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.09)
      gain.gain.setValueAtTime(vol * 0.09, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
      osc.start(now)
      osc.stop(now + 0.12)
    }
  } catch (e) {}
}

export async function play(name) {
  if (!enabled()) return
  // Try preload once
  if (!buffers[name] && FILES[name]) preload(name)
  if (ctx && buffers[name]) {
    try {
      const vol = getVolume()
      const src = ctx.createBufferSource()
      src.buffer = buffers[name]
      const gain = ctx.createGain()
      gain.gain.value = vol
      src.connect(gain)
      gain.connect(ctx.destination)
      src.start(0)
      return
    } catch (e) {
      // fall through to oscillator fallback
    }
  }
  return playOsc(name)
}

export function setBuffer(name, audioBuffer) {
  buffers[name] = audioBuffer
}

export default { play, setBuffer, preload }
