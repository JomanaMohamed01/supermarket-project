"use client";

import { createPortal } from "react-dom";

type ActionLoaderProps = {
  message: string;
};

export function ActionLoader({ message }: ActionLoaderProps) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="action-loader-overlay"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="page-loader-ring" aria-hidden="true">
        <span className="page-loader-orbit" />
        <span className="page-loader-core">F</span>
      </div>
      <p className="font-[family-name:var(--font-fraunces)] text-lg font-semibold tracking-wide text-ink">
        {message}
      </p>
    </div>,
    document.body,
  );
}
