import { Component, type ErrorInfo, type ReactNode } from "react";

import { ErrorState } from "@/components/ui/ErrorState";
import { reportError } from "@/lib/errorReporting";

interface SectionErrorBoundaryProps {
  title?: string;
  children: ReactNode;
}

interface SectionErrorBoundaryState {
  error: unknown;
  hasError: boolean;
}

export class SectionErrorBoundary extends Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
  state: SectionErrorBoundaryState = { error: undefined, hasError: false };

  static getDerivedStateFromError(error: unknown): SectionErrorBoundaryState {
    return { error, hasError: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    reportError(error, { componentStack: info.componentStack });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <ErrorState
        title={this.props.title ?? "This section failed to display"}
        message={
          this.state.error instanceof Error
            ? this.state.error.message
            : undefined
        }
        onRetry={() => this.setState({ error: undefined, hasError: false })}
      />
    );
  }
}
