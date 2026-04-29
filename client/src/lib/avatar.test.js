import { describe, it, expect } from 'vitest'
import { initialsFor, colorsFor } from './avatar.js'

describe('initialsFor', () => {
  it('handles empty/null input', () => {
    expect(initialsFor('')).toBe('·')
    expect(initialsFor(null)).toBe('·')
    expect(initialsFor(undefined)).toBe('·')
  })

  it('takes first two letters of single name', () => {
    expect(initialsFor('amna')).toBe('AM')
  })

  it('takes first letter of first two parts', () => {
    expect(initialsFor('Amna Khalid')).toBe('AK')
    expect(initialsFor('first_last')).toBe('FL')
    expect(initialsFor('a-b-c')).toBe('AB')
  })

  it('uppercases', () => {
    expect(initialsFor('john')).toBe('JO')
  })
})

describe('colorsFor', () => {
  it('returns a stable palette entry for the same input', () => {
    expect(colorsFor('amna')).toEqual(colorsFor('amna'))
  })

  it('returns valid hex pair', () => {
    const { bg, fg } = colorsFor('whatever')
    expect(bg).toMatch(/^#[0-9a-f]{6}$/i)
    expect(fg).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('falls back gracefully on empty input', () => {
    expect(() => colorsFor('')).not.toThrow()
    expect(() => colorsFor(null)).not.toThrow()
  })
})
