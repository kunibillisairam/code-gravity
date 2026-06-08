import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Auto-heal chunk load errors (failed dynamic imports after a new deploy)
    const errorString = error?.toString() || '';
    if (
      errorString.includes('Failed to fetch dynamically imported module') ||
      errorString.toLowerCase().includes('chunkloaderror')
    ) {
      const lastReload = sessionStorage.getItem('last_chunk_reload');
      const now = Date.now();
      // Prevent infinite reload loops by limiting to once every 10 seconds
      if (!lastReload || now - parseInt(lastReload) > 10000) {
        sessionStorage.setItem('last_chunk_reload', now.toString());
        console.warn('Chunk load failure detected. Instantly reloading terminal to synchronize assets...');
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#080a10] p-4 text-center">
          <div className="max-w-md w-full bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-6 shadow-2xl">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-slate-850 dark:text-white uppercase tracking-tight">System Fault Detected</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-light">
              We encountered an unexpected error while rendering this sector. The grid has been paused to prevent data corruption.
            </p>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-850 rounded-lg text-left overflow-auto max-h-32">
              <code className="text-xs text-rose-500 dark:text-rose-400 font-mono">
                {this.state.error?.toString()}
              </code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-cyber-cyan hover:bg-cyan-400 text-space-900 font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Reboot Terminal
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
