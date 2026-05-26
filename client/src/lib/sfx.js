import { useStore } from '../store/index.js'

let audioContext

function getAudioContext() {
  if (typeof window === 'undefined') return null
  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!AudioContext) return null
  if (!audioContext) audioContext = new AudioContext()
  if (audioContext.state === 'suspended') audioContext.resume().catch(() => {})
  return audioContext
}

function getVolume() {
  return useStore.getState().sfxVolume ?? 0.8
}

function tone(ctx, { start, duration, from, to, type = 'sine', volume = 0.04 }) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const end = start + duration

  osc.type = type
  osc.frequency.setValueAtTime(from, start)
  osc.frequency.exponentialRampToValueAtTime(to, end)

  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(volume * getVolume(), start + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, end)

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(start)
  osc.stop(end + 0.01)
}

function play(name) {
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime + 0.006

  if (name === 'receive') {
    tone(ctx, { start: now, duration: 0.08, from: 740, to: 980, volume: 0.07 })
    tone(ctx, { start: now + 0.055, duration: 0.09, from: 980, to: 1320, volume: 0.055 })
    return
  }

  if (name === 'reaction') {
    tone(ctx, { start: now, duration: 0.07, from: 520, to: 860, type: 'triangle', volume: 0.06 })
    tone(ctx, { start: now + 0.045, duration: 0.08, from: 860, to: 1180, type: 'triangle', volume: 0.05 })
    return
  }

  tone(ctx, { start: now, duration: 0.075, from: 1120, to: 1580, volume: 0.065 })
}

function unlock() {
  getAudioContext()
}

export default { play, unlock }
