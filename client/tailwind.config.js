/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'on-error-container': '#ffdad6',
        'outline-variant': '#4a463e',
        'on-primary-fixed-variant': '#4c4638',
        background: '#13140f',
        'on-background': '#e4e3da',
        'on-tertiary': '#31302c',
        'on-secondary': '#323127',
        'on-secondary-fixed': '#1d1c13',
        'on-tertiary-container': '#5a5853',
        'on-tertiary-fixed-variant': '#484742',
        'surface-dim': '#13140f',
        'surface-container-lowest': '#0e0f0a',
        surface: '#13140f',
        'on-primary-container': '#5e5849',
        'secondary-container': '#49473c',
        error: '#ffb4ab',
        'inverse-primary': '#645e4f',
        'surface-container-high': '#2a2a25',
        primary: '#f5ebd7',
        'primary-container': '#d8cfbc',
        'surface-container-low': '#1b1c17',
        tertiary: '#efebe5',
        'on-primary-fixed': '#1f1b0f',
        'error-container': '#93000a',
        'secondary-fixed-dim': '#cac6b9',
        'on-error': '#690005',
        'primary-fixed': '#ebe2ce',
        'surface-container-highest': '#34352f',
        'surface-tint': '#cec6b3',
        'surface-variant': '#34352f',
        'inverse-surface': '#e4e3da',
        'secondary-fixed': '#e7e2d4',
        'on-surface': '#e4e3da',
        'inverse-on-surface': '#30312b',
        'on-tertiary-fixed': '#1c1c18',
        'on-primary': '#353023',
        secondary: '#cac6b9',
        'tertiary-fixed-dim': '#c9c6c0',
        'on-secondary-fixed-variant': '#49473c',
        'on-secondary-container': '#b9b5a8',
        'surface-bright': '#393a34',
        'primary-fixed-dim': '#cec6b3',
        'tertiary-fixed': '#e6e2db',
        'surface-container': '#1f201b',
        'tertiary-container': '#d2cfc9',
        'on-surface-variant': '#ccc6bb',
        outline: '#959086',
        // tactical pulse green per spec
        'pulse-mint': '#00F6AC'
      },
      borderRadius: { DEFAULT: '1rem', lg: '2rem', xl: '3rem', full: '9999px' },
      spacing: {
        base: '8px', xs: '4px', sm: '12px', md: '24px', lg: '48px', xl: '80px',
        gutter: '24px', margin: '32px'
      },
      fontFamily: {
        body: ['"Space Grotesk"', 'system-ui', 'sans-serif']
      },
      fontSize: {
        'body-md': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'label-caps': ['12px', { lineHeight: '1', letterSpacing: '0.1em', fontWeight: '700' }],
        'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        h3: ['24px', { lineHeight: '1.3', fontWeight: '500' }],
        h2: ['32px', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
        h1: ['48px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }]
      }
    }
  },
  plugins: []
}
