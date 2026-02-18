'use client';

import { Component } from 'react';

/**
 * Reusable error boundary for admin page sections (charts, tables, forms).
 * Catches render errors in children so a single broken section
 * doesn't crash the whole admin page.
 */
export class SectionErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[SectionError]', error.message, errorInfo?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="border border-red-100 bg-red-50 rounded-lg p-4 text-sm">
          <p className="text-red-600 font-medium">
            This section failed to load
          </p>
          {this.state.error?.message && (
            <p className="text-red-400 text-xs mt-1">
              {this.state.error.message}
            </p>
          )}
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-red-500 underline mt-2 text-xs"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
