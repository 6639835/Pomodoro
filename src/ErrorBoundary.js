import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      errorId: Date.now() // Unique ID for this error instance
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Report to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: reportError(error, errorInfo);
      console.warn('Error reported:', error.message);
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
          <div className="max-w-2xl w-full">
            {/* Error Card */}
            <div className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-red-200/50 dark:border-red-800/50 p-8 text-center">
              {/* Error Icon */}
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                <AlertCircle className="w-10 h-10 text-white" />
              </div>

              {/* Error Message */}
              <h1 className="text-3xl font-bold text-neutral-800 dark:text-white mb-4">
                Oops! Something went wrong
              </h1>
              <p className="text-lg text-neutral-600 dark:text-neutral-300 mb-8">
                The Pomodoro timer encountered an unexpected error. Don't worry, your progress is safe!
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <button
                  onClick={this.handleReset}
                  className="flex items-center justify-center space-x-2 bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>Try Again</span>
                </button>
                
                <button
                  onClick={this.handleReload}
                  className="flex items-center justify-center space-x-2 bg-white/20 hover:bg-white/30 dark:bg-neutral-800/20 dark:hover:bg-neutral-800/30 backdrop-blur-md border border-white/30 dark:border-neutral-700/30 text-neutral-700 dark:text-neutral-300 font-semibold py-3 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <Home className="w-5 h-5" />
                  <span>Reload App</span>
                </button>
              </div>

              {/* Development Error Details */}
              {isDevelopment && this.state.error && (
                <details className="text-left bg-neutral-100 dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700">
                  <summary className="font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer mb-4">
                    🛠️ Development Error Details
                  </summary>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2">Error:</h4>
                      <pre className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/50 p-3 rounded-xl overflow-auto">
                        {this.state.error.toString()}
                      </pre>
                    </div>
                    
                    {this.state.errorInfo && this.state.errorInfo.componentStack && (
                      <div>
                        <h4 className="font-semibold text-orange-600 dark:text-orange-400 mb-2">Component Stack:</h4>
                        <pre className="text-sm text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/50 p-3 rounded-xl overflow-auto">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Error ID */}
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-4">
                Error ID: {this.state.errorId}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 