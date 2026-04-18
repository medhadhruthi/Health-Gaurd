import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
          background: 'var(--background)',
          color: 'var(--text-main)'
        }}>
          <div style={{ maxWidth: 520, textAlign: 'center' }}>
            <h1>Oops, something went wrong.</h1>
            <p style={{ marginTop: 16, color: 'var(--text-muted)' }}>
              The app encountered an error while rendering. Please refresh the page or try again later.
            </p>
            <pre style={{
              marginTop: 24,
              padding: 16,
              borderRadius: 16,
              background: 'rgba(0,0,0,0.05)',
              color: 'var(--text-main)',
              overflowX: 'auto'
            }}>
              {this.state.error?.toString()}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
