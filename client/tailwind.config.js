/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'on-error-container': '#ffdad6',
        'outline-variant': '#e0e0e0',
        'on-primary-fixed-variant': '#4c4638',
        background: '#f8f8f8',
        'on-background': '#1a1a1a',
        'on-tertiary': '#31302c',
        'on-secondary': '#323127',
        'on-secondary-fixed': '#1d1c13',
        'on-tertiary-container': '#5a5853',
        'on-tertiary-fixed-variant': '#484742',
        'surface-dim': '#f0f0f0',
        'surface-container-lowest': '#ffffff',
        surface: '#ffffff',
        'on-primary-container': '#DF5B30',
        'secondary-container': '#f5f5f5',
        error: '#d32f2f',
        'inverse-primary': '#645e4f',
        'surface-container-high': '#f5f5f5',
        primary: '#DF5B30',
        'primary-container': '#DF5B30',
        'surface-container-low': '#fafafa',
        tertiary: '#DF2EC1',
        'on-primary-fixed': '#1f1b0f',
        'error-container': '#fce4ec',
        'secondary-fixed-dim': '#cac6b9',
        'on-error': '#ffffff',
        'primary-fixed': '#DF5B30',
        'surface-container-highest': '#f0f0f0',
        'surface-tint': '#DF5B30',
        'surface-variant': '#f5f5f5',
        'inverse-surface': '#1a1a1a',
        'secondary-fixed': '#e7e2d4',
        'on-surface': '#1a1a1a',
        'inverse-on-surface': '#ffffff',
        'on-tertiary-fixed': '#1c1c18',
        'on-primary': '#ffffff',
        secondary: '#666666',
        'tertiary-fixed-dim': '#c9c6c0',
        'on-secondary-fixed-variant': '#49473c',
        'on-secondary-container': '#666666',
        'surface-bright': '#ffffff',
        'primary-fixed-dim': '#DF5B30',
        'tertiary-fixed': '#e6e2db',
        'surface-container': '#ffffff',
        'tertiary-container': '#DF2EC1',
        'on-surface-variant': '#666666',
        outline: '#999999',
        'pulse-mint': '#4CAF50',
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
        'comic': '0 4px 16px rgba(0,0,0,0.08)',
        'comic-sm': '0 2px 8px rgba(0,0,0,0.06)',
        'neon': '0 4px 20px rgba(223,91,48,0.2), 0 2px 8px rgba(223,91,48,0.1)',
        'neon-sm': '0 2px 10px rgba(223,91,48,0.15)'
      }
    }
  },
  plugins: []
}
