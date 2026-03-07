import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          fontFamily: 'system-ui, sans-serif',
          backgroundColor: '#fff',
          color: '#333',
        }}>
          <h1 style={{ fontSize: 24, marginBottom: 16 }}>Произошла ошибка</h1>
          <pre style={{
            padding: 16,
            backgroundColor: '#f5f5f5',
            borderRadius: 8,
            overflow: 'auto',
            maxWidth: '100%',
            fontSize: 12,
          }}>
            {this.state.error?.message}
          </pre>
          <p style={{ marginTop: 16, color: '#666' }}>
            Проверьте консоль браузера (F12) для подробностей.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              marginTop: 24,
              padding: '12px 24px',
              backgroundColor: '#e11d48',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            Попробовать снова
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
