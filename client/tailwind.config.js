/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'on-error-container': '#ffdad6',
        'outline-variant': '#1a1a1a',
        'on-primary-fixed-variant': '#4c4638',
        background: '#000000',
        'on-background': '#e8e8e8',
        'on-tertiary': '#31302c',
        'on-secondary': '#323127',
        'on-secondary-fixed': '#1d1c13',
        'on-tertiary-container': '#5a5853',
        'on-tertiary-fixed-variant': '#484742',
        'surface-dim': '#000000',
        'surface-container-lowest': '#000000',
        surface: '#000000',
        'on-primary-container': '#ff2d7b',
        'secondary-container': '#1a1a1a',
        error: '#ff4d6a',
        'inverse-primary': '#645e4f',
        'surface-container-high': '#111111',
        primary: '#ff2d7b',
        'primary-container': '#ff2d7b',
        'surface-container-low': '#080808',
        tertiary: '#b44dff',
        'on-primary-fixed': '#1f1b0f',
        'error-container': '#93000a',
        'secondary-fixed-dim': '#cac6b9',
        'on-error': '#690005',
        'primary-fixed': '#ff2d7b',
        'surface-container-highest': '#1a1a1a',
        'surface-tint': '#ff2d7b',
        'surface-variant': '#0d0d0d',
        'inverse-surface': '#e4e3da',
        'secondary-fixed': '#e7e2d4',
        'on-surface': '#e8e8e8',
        'inverse-on-surface': '#30312b',
        'on-tertiary-fixed': '#1c1c18',
        'on-primary': '#000000',
        secondary: '#00f0ff',
        'tertiary-fixed-dim': '#c9c6c0',
        'on-secondary-fixed-variant': '#49473c',
        'on-secondary-container': '#b9b5a8',
        'surface-bright': '#1a1a1a',
        'primary-fixed-dim': '#ff2d7b',
        'tertiary-fixed': '#e6e2db',
        'surface-container': '#0a0a0a',
        'tertiary-container': '#b44dff',
        'on-surface-variant': '#999999',
        outline: '#444444',
        'pulse-mint': '#39ff14',
        // Spider-Verse accent palette
        'sv-accent': 'var(--sv-accent)',
        'sv-cyan': 'var(--sv-cyan)',
        'sv-yellow': 'var(--sv-yellow)',
        'sv-purple': 'var(--sv-purple)',
        'sv-green': 'var(--sv-green)'
      },
      borderRadius: { DEFAULT: '1rem', lg: '2rem', xl: '3rem', full: '9999px' },
      spacing: {
        base: '8px', xs: '4px', sm: '12px', md: '24px', lg: '48px', xl: '80px',
        gutter: '24px', margin: '32px'
      },
      fontFamily: {
        body: ['Inter', '"Space Grotesk"', 'system-ui', 'sans-serif'],
        comic: ['Inter', 'system-ui', 'sans-serif'],
        marker: ['Inter', 'system-ui', 'sans-serif']
      },
      fontSize: {
        'body-md': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'label-caps': ['12px', { lineHeight: '1', letterSpacing: '0.1em', fontWeight: '700' }],
        'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        h3: ['24px', { lineHeight: '1.3', fontWeight: '500' }],
        h2: ['32px', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
        h1: ['48px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }]
      },
      keyframes: {
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-2px) rotate(-0.5deg)' },
          '75%': { transform: 'translateX(2px) rotate(0.5deg)' }
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' }
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' }
        }
      },
      animation: {
        'shake': 'shake 0.3s ease-in-out',
        'float': 'float 3s ease-in-out infinite',
        'scan-line': 'scan-line 4s linear infinite'
      },
      boxShadow: {
        'comic': '4px 4px 0 rgba(0,0,0,0.8)',
        'comic-sm': '2px 2px 0 rgba(0,0,0,0.8)',
        'neon': '0 0 10px var(--sv-accent), 0 0 20px var(--sv-accent), 0 0 40px rgba(255,59,107,0.2)',
        'neon-sm': '0 0 5px var(--sv-accent), 0 0 10px rgba(255,59,107,0.15)'
      }
    }
  },
  plugins: []
}
