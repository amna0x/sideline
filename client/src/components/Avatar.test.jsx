import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Avatar from './Avatar.jsx'

describe('<Avatar>', () => {
  it('renders <img> when url provided', () => {
    render(<Avatar url="https://example.com/me.png" name="amna" alt="me" />)
    const img = screen.getByAltText('me')
    expect(img.tagName).toBe('IMG')
    expect(img).toHaveAttribute('src', 'https://example.com/me.png')
  })

  it('falls back to initials when no url', () => {
    render(<Avatar name="Amna Khalid" alt="amna" />)
    expect(screen.getByText('AK')).toBeInTheDocument()
  })

  it('renders neutral marker for empty name + no url', () => {
    render(<Avatar />)
    expect(screen.getByText('·')).toBeInTheDocument()
  })
})
