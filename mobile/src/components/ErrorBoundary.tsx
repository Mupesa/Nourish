/**
 * Last line of defence: catches uncaught render/lifecycle errors anywhere
 * below it and shows a retry screen instead of a blank or crashed app.
 * Most failures should still be handled closer to the source (see
 * ProfileContext's `error` state) — this only catches what those miss.
 */
import React from "react";
import { ErrorScreen } from "./ErrorScreen";

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.warn("[ErrorBoundary] caught", error, info.componentStack);
  }

  private retry = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <ErrorScreen
          title="Nourish hit a snag"
          message="Something unexpected happened. Try again — if it keeps happening, restart the app."
          onRetry={this.retry}
        />
      );
    }
    return this.props.children;
  }
}
