import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: unknown) {
        console.error("[ErrorBoundary] Uncaught error:", error, info);
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-6 bg-background">
                    <div className="w-full max-w-md text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 text-destructive mb-6">
                            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold mb-2 text-foreground">Something went wrong</h1>
                        <p className="text-muted-foreground mb-6 text-sm">
                            An unexpected error occurred. Please reload the app to continue.
                        </p>
                        {/* Only show raw error details in development */}
                        {import.meta.env.DEV && this.state.error && (
                            <pre className="text-left text-xs bg-muted p-3 rounded-lg overflow-auto mb-6 text-muted-foreground">
                                {String(this.state.error.message || this.state.error)}
                            </pre>
                        )}
                        <Button
                            onClick={this.handleReload}
                            size="lg"
                            className="w-full rounded-2xl font-bold"
                        >
                            Reload App
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}