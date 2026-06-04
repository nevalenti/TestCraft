import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (this.props.onError) {
      this.props.onError(error, info);
    } else {
      console.error("Unhandled error:", error, info);
    }
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="text-center">
              <p className="text-error font-semibold mb-2">
                Something went wrong
              </p>
              <p className="text-base-content/65 text-sm mb-4 max-w-sm mx-auto">
                {this.state.error.message}
              </p>
              <button
                className="btn btn-primary btn-sm rounded-full"
                onClick={() => this.setState({ error: null })}
              >
                <ArrowPathIcon className="w-4 h-4" />
                Try again
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
