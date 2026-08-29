import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { AlertOctagon, RefreshCcw } from "lucide-react";

interface Props {
    children: ReactNode
}

interface State { 
    hasError: boolean
    errorMsg: string
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        errorMsg: ""
    }


    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI
        return { hasError: true, errorMsg: error.message }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // In an enterprise app, you would log this to Sentry or Datadog
        console.error("Uncaught error intercepted by ErrorBoundary", error, errorInfo)
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-100">
                        <div className="flex justify-center mb-6">
                            <div className="p-4 bg-red-50 rounded-full text-red-500">
                                <AlertOctagon className="w-12 h-12" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">System Error</h1>
                        <p className="text-slate-500 mb-8">
                            We've encountered an unexpected issue while rendering this screen. Our IT team has been notified.
                        </p>
                        <button
                        onClick={() => window.location.reload()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            <RefreshCcw className="w-5 h-5" />
                            Reload Application
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}