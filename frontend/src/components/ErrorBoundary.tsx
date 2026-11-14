import { Component, type ErrorInfo, type ReactNode } from 'react';

type State = { error: Error | null };

/**
 * Catches a crash while a page renders and shows a message instead of a blank
 * screen. React only offers this as a class component.
 *
 * Give it a `key` that changes on navigation (AppShell uses the URL) so moving
 * to another page clears the error.
 */
class ErrorBoundary extends Component<{ children: ReactNode }, State> {
    state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('[ErrorBoundary] Page crashed:', error, info.componentStack);
    }

    render() {
        if (!this.state.error) return this.props.children;
        return (
            <div className="overlay-center">
                <div className="overlay-box max-w-md">
                    <h1 className="text-xl font-bold">This page hit a problem</h1>
                    <p className="mt-2 text-purple-200/80">
                        Something on it failed to load properly. Reloading usually fixes it; if not, the server may be mid-update.
                    </p>
                    <div className="mt-6 flex justify-center gap-3">
                        <button onClick={() => window.location.reload()} className="btn-primary">Reload</button>
                        <a href="/dashboard" className="btn-secondary">Home</a>
                    </div>
                </div>
            </div>
        );
    }
}

export default ErrorBoundary;
