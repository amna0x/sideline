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
