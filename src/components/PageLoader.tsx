export function PageLoader() {
  return (
    <div
      className="page-loader fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-white"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <div className="page-loader-ring" aria-hidden="true">
        <span className="page-loader-orbit" />
        <span className="page-loader-core">F</span>
      </div>
      <p className="font-[family-name:var(--font-fraunces)] text-lg font-semibold tracking-wide text-ink">
        Loading
        <span className="page-loader-dots" aria-hidden="true">
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </span>
      </p>
    </div>
  );
}
