import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("DocMind React ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white p-8 flex flex-col items-center justify-center font-sans">
          <div className="max-w-2xl bg-zinc-950 border border-red-500/50 rounded-3xl p-8 shadow-2xl">
            <h1 className="text-2xl font-bold text-red-400 mb-2">DocMind Application Error</h1>
            <p className="text-sm text-zinc-300 mb-4">
              An unexpected error occurred during rendering:
            </p>
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-xs font-mono text-red-300 overflow-x-auto mb-6">
              {this.state.error?.toString()}
            </div>
            <button
              onClick={() => {
                localStorage.removeItem("docmind_token");
                localStorage.removeItem("docmind_user");
                window.location.href = "/";
              }}
              className="px-6 py-3 bg-cyan-500 text-black font-bold text-xs rounded-xl hover:bg-cyan-400 transition-colors"
            >
              Reset Session & Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
