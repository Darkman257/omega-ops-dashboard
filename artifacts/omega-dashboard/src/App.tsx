import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Router as WouterRouter } from "wouter";
import { Router } from "@/components/layout/Router";
import { AppProvider } from "@/context/AppContext";

// Extract BASE_URL manipulation to constants
const getBasePath = () => import.meta.env.BASE_URL.replace(/\/$/, "");

// Simple Error Boundary Fallback
function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-screen bg-black text-primary flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-4xl font-black mb-4">SYSTEM CRITICAL ERROR</h1>
      <pre className="bg-white/5 p-4 rounded-lg text-xs overflow-auto max-w-full text-red-400 border border-red-500/50">
        {error.message}
      </pre>
      <button 
        onClick={() => window.location.reload()}
        className="mt-8 px-6 py-2 bg-primary text-black font-bold rounded-full hover:scale-105 transition-transform"
      >
        REBOOT SYSTEM
      </button>
    </div>
  );
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

/**
 * Main Application Entry Point
 * Wraps the app in necessary providers for state, tooltips, and routing.
 */
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      {/* Global state management */}
      <AppProvider>
        {/* Enables tooltip functionality across the app */}
        <TooltipProvider>
          {/* Client-side routing with base path support */}
          <WouterRouter base={getBasePath()}>
            <Router />
          </WouterRouter>
          {/* Toast notification system */}
          <Toaster />
        </TooltipProvider>
      </AppProvider>
    </ErrorBoundary>
  );
};

export default React.memo(App);
