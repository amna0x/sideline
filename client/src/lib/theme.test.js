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

  it('has at least 5 themes with valid hex swatches', () => {
    const all = Object.values(THEMES)
    expect(all.length).toBeGreaterThanOrEqual(5)
    for (const t of all) {
      expect(t.id).toMatch(/^[a-z]+$/)
      expect(t.name).toMatch(/./)
      expect(t.swatches.length).toBeGreaterThanOrEqual(3)
      for (const s of t.swatches) expect(s).toMatch(/^#[0-9a-f]{3,8}$/i)
    }
  })
})
