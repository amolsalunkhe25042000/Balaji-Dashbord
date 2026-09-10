export default function Loading() {
  return (
    <main className="loading-screen" aria-live="polite" aria-label="Loading Balaji CRM">
      <div className="paint-loader">
        <div className="loader-brand">Balaji CRM</div>
        <div className="paint-stage" aria-hidden="true">
          <div className="paint-surface" />
          <div className="roller-handle" />
          <div className="roller-frame" />
          <div className="roller" />
          <span className="paint-drop paint-drop-one" />
          <span className="paint-drop paint-drop-two" />
          <span className="paint-drop paint-drop-three" />
        </div>
        <p className="loading-label">Preparing your workspace<span className="loading-dots">...</span></p>
      </div>
    </main>
  );
}
