'use client';

import React from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import Honeybadger from '@honeybadger-io/react';

// Initialize Honeybadger
if (typeof window !== 'undefined') {
  Honeybadger.configure({
    apiKey: process.env.NEXT_PUBLIC_HONEYBADGER_API_KEY,
    environment: process.env.NODE_ENV,
    enableUncaught: true,
    enableUnhandledRejection: true,
  });
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the component tree
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Report to Honeybadger
    if (typeof window !== 'undefined') {
      Honeybadger.notify(error, {
        context: {
          componentStack: errorInfo.componentStack,
        },
      });

      console.error('Error details:', {
        error: error.toString(),
        componentStack: errorInfo.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent,
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <FiAlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Oops! Something went wrong
              </h1>
              <p className="text-gray-600">
                We encountered an unexpected error. Please try again.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 rounded-lg text-left">
                <p className="text-sm font-mono text-red-800 mb-2">
                  {this.state.error.toString()}
                </p>
                <details className="text-xs text-red-600">
                  <summary className="cursor-pointer font-semibold mb-1">
                    Stack Trace
                  </summary>
                  <pre className="whitespace-pre-wrap overflow-auto max-h-40">
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="btn btn-primary flex items-center gap-2"
              >
                <FiRefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="btn btn-outline"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
