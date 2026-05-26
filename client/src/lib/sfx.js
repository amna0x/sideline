import { useStore } from '../store/index.js'

const FILES = {
  send: '/sfx/send.wav',
  receive: '/sfx/receive.wav',
  reaction: '/sfx/reaction.wav'
}

let audioContext = null
let buffers = {}

function getContext() {
  if (typeof window === 'undefined') return null
  if (!audioContext) {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return null
    audioContext = new Ctx()
  }
  return audioContext
}

function enabled() {
  try { return !!useStore.getState().sfxEnabled } catch { return true }
}

function volume() {
  try { return Math.max(0, Math.min(1, useStore.getState().sfxVolume ?? 0.8)) } catch { return 0.8 }
}

async function preload(name) {
  const ctx = getContext()
  if (!ctx || buffers[name] || !FILES[name]) return
  try {
    const res = await fetch(FILES[name], { cache: 'no-cache' })
    if (!res.ok) return
    const ab = await res.arrayBuffer()
    buffers[name] = await ctx.decodeAudioData(ab)
  } catch {
    // Fallback oscillator will handle it.
  }
}

function playTone(name) {
  const ctx = getContext()
  if (!ctx) return
  const gain = ctx.createGain()
  const osc = ctx.createOscillator()
  osc.connect(gain)
  gain.connect(ctx.destination)
  const now = ctx.currentTime
  const vol = volume()

  if (name === 'send') {
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1200, now)
    osc.frequency.exponentialRampToValueAtTime(1800, now + 0.08)
    gain.gain.setValueAtTime(vol * 0.12, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
    osc.start(now)
    osc.stop(now + 0.12)
    return
  }

  if (name === 'receive') {
    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, now)
    osc.frequency.exponentialRampToValueAtTime(1000, now + 0.06)
    gain.gain.setValueAtTime(vol * 0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1)
    osc.start(now)
    osc.stop(now + 0.1)
    return
  }

  osc.type = 'triangle'
  osc.frequency.setValueAtTime(600, now)
  osc.frequency.exponentialRampToValueAtTime(900, now + 0.09)
  gain.gain.setValueAtTime(vol * 0.09, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
  osc.start(now)
  osc.stop(now + 0.12)
}

export async function play(name) {
  if (!enabled()) return
  await preload(name)
  const ctx = getContext()
  if (ctx && buffers[name]) {
    try {
      const src = ctx.createBufferSource()
      const gain = ctx.createGain()
      src.buffer = buffers[name]
      gain.gain.value = volume()
      src.connect(gain)
      gain.connect(ctx.destination)
      src.start(0)
      return
    } catch {
      // fallback below
    }
  }
  playTone(name)
}

export function preloadAll() {
  Object.keys(FILES).forEach((name) => { preload(name) })
}

export default { play, preloadAll }
