export const THEMES = {
  default: {
    id: 'default',
    name: 'Tactical Olive',
    swatches: ['#13140f', '#d8cfbc', '#00F6AC']
  },
  mint: {
    id: 'mint',
    name: 'Mint Edge',
    swatches: ['#020202', '#00f6ac', '#ffffff']
  },
  inferno: {
    id: 'inferno',
    name: 'Inferno',
    swatches: ['#0a0204', '#ff3b6b', '#ffe9d6']
  },
  cobalt: {
    id: 'cobalt',
    name: 'Cobalt',
    swatches: ['#020611', '#5aa8ff', '#e8f0ff']
  },
  solar: {
    id: 'solar',
    name: 'Solar Flare',
    swatches: ['#0d0a02', '#ffc94a', '#fff5d6']
  }
}

const KEY = 'sideline.theme'

export function applyTheme(id) {
  const theme = THEMES[id] ? id : 'default'
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem(KEY, theme)
}

export function loadTheme() {
  return localStorage.getItem(KEY) || 'default'
}
