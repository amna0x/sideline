import React from 'react'

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, details: '' }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    const details = [error?.message, errorInfo?.componentStack].filter(Boolean).join('\n')
    this.setState({ details })
    try {
      console.error('AppErrorBoundary caught an error:', error, errorInfo)
    } catch (e) {}
  }

  componentDidUpdate(prevProps) {
    const prevReset = JSON.stringify(prevProps.resetKeys || [])
    const nextReset = JSON.stringify(this.props.resetKeys || [])
    if (this.state.hasError && prevReset !== nextReset) {
      this.setState({ hasError: false, details: '' })
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-dvh bg-[#f8f8f8] flex items-center justify-center px-5">
        <div className="w-full max-w-sm bg-white border border-[#e0e0e0] rounded-2xl p-5 shadow-[0_12px_30px_rgba(0,0,0,0.08)]">
          <h2 className="font-comic text-xl text-[#1a1a1a] mb-2">Something went wrong</h2>
          <p className="text-sm text-[#666] mb-4">The app hit an unexpected error. Try reloading this screen.</p>
          <button
            onClick={() => this.setState({ hasError: false, details: '' })}
            className="w-full rounded-xl bg-[var(--sv-accent)] text-white font-comic text-sm py-2.5"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }
}
