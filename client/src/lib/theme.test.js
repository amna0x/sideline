import { describe, it, expect, beforeEach } from 'vitest'
import { applyTheme, loadTheme, THEMES } from './theme.js'

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('default theme falls back when no value stored', () => {
    expect(loadTheme()).toBe('default')
  })

  it('applies known theme + persists', () => {
    applyTheme('mint')
    expect(document.documentElement.getAttribute('data-theme')).toBe('mint')
    expect(loadTheme()).toBe('mint')
  })

  it('applies default for unknown id', () => {
    applyTheme('chartreuse-rave')
    expect(document.documentElement.getAttribute('data-theme')).toBe('default')
  })

  it('exposes catalog with id + name', () => {
    expect(THEMES.default.name).toMatch(/./)
    expect(THEMES.mint.id).toBe('mint')
  })
})
