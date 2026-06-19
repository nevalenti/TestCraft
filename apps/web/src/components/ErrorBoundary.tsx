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
  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  state: State = { error: null };

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
              <p className="mb-2 font-semibold text-error">
                Something went wrong
              </p>
              <p className="mx-auto mb-4 max-w-sm text-sm text-base-content/65">
                {this.state.error.message}
              </p>
              <button
                className="btn rounded-full btn-sm btn-primary"
                onClick={() => this.setState({ error: null })}
              >
                <ArrowPathIcon className="size-4" />
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
