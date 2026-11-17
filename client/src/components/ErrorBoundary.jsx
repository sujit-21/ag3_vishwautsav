import React from 'react'

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        console.error('Portal ErrorBoundary caught an error:', error, errorInfo)
    }

    handleReload = () => {
        window.location.reload()
    }

    render() {
        if (this.state.hasError) {
            return (
                <div 
                    className="min-vh-100 d-flex flex-column align-items-center justify-content-center p-3 text-center"
                    style={{ background: 'var(--primary-bg, #FFFDF9)' }}
                >
                    <div 
                        className="p-4 p-sm-5 rounded-4 shadow-lg border"
                        style={{ maxWidth: '480px', background: '#ffffff', borderColor: 'var(--glass-border)' }}
                    >
                        <div 
                            className="d-flex align-items-center justify-content-center mx-auto mb-3 rounded-circle"
                            style={{ width: '56px', height: '56px', background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626' }}
                        >
                            ⚠️
                        </div>
                        <h5 className="fw-extrabold text-main mb-1.5">Something went wrong</h5>
                        <p className="extra-tiny text-muted mb-3" style={{ lineHeight: '1.6' }}>
                            {this.state.error?.message || 'An unexpected rendering error occurred. Please reload to refresh the view.'}
                        </p>
                        <button
                            type="button"
                            onClick={this.handleReload}
                            className="btn btn-premium rounded-pill px-4 py-2 extra-tiny fw-bold shadow-sm"
                        >
                            Reload Portal
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
