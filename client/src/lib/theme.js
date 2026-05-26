export const THEMES = {
  default: {
    id: 'default',
    name: 'Sideline',
    swatches: ['#f8f8f8', '#DF5B30', '#ffffff']
  },
  spiderverse: {
    id: 'spiderverse',
    name: 'Spiderverse',
    swatches: ['#000000', '#ff2d7b', '#00f0ff']
  },
  mint: {
    id: 'mint',
    name: 'Mint Edge',
    swatches: ['#000000', '#00f6ac', '#ffffff']
  },
  inferno: {
    id: 'inferno',
    name: 'Inferno',
    swatches: ['#000000', '#ff3b6b', '#ffe9d6']
  },
  cobalt: {
    id: 'cobalt',
    name: 'Cobalt',
    swatches: ['#000000', '#5aa8ff', '#e8f0ff']
  },
  solar: {
    id: 'solar',
    name: 'Solar Flare',
    swatches: ['#000000', '#ffc94a', '#fff5d6']
  }
}

const KEY = 'sideline.theme'

export function applyTheme(id, { animate = false } = {}) {
  const theme = THEMES[id] ? id : 'default'
  if (animate) {
    document.documentElement.classList.remove('theme-switching')
    void document.documentElement.offsetWidth
    document.documentElement.classList.add('theme-switching')
    window.setTimeout(() => document.documentElement.classList.remove('theme-switching'), 520)
  }
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem(KEY, theme)
}

export function loadTheme() {
  return localStorage.getItem(KEY) || 'default'
}

export function saveThemeToProfile(userId, themeId, apiClient) {
  if (!userId || !apiClient) return
  apiClient.patch(`/api/users/${userId}`, { theme: themeId }).catch(() => {})
}

export function loadThemeFromProfile(profile) {
  if (profile?.theme && THEMES[profile.theme]) {
    localStorage.setItem(KEY, profile.theme)
    return profile.theme
  }
  return null
}
