"use client";

import React from "react";

type Props = { children: React.ReactNode };

type State = { error: Error | null };

export default class ChatErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 bg-background px-4 text-center text-foreground">
          <p className="text-lg font-semibold">Không tải được Opus Chat</p>
          <p className="max-w-sm text-sm text-foreground-muted">
            {this.state.error.message || "Lỗi không xác định"}
          </p>
          <button
            type="button"
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            onClick={() => {
              this.setState({ error: null });
              window.location.reload();
            }}
          >
            Tải lại
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
