'use client';

// Catch-all for errors that escape the locale-level boundary (e.g. layout
// failures, locale resolution problems). Must include its own <html>/<body>.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '2rem',
          fontFamily: 'system-ui, sans-serif',
          background: '#f9fafb',
        }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: 12 }}>
            Something went wrong
          </h1>
          <p style={{ color: '#6b7280', maxWidth: 480, marginBottom: 20 }}>
            An unexpected error occurred. Please refresh the page or try again in a moment.
          </p>
          {error.digest && (
            <code style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: 20 }}>
              Ref: {error.digest}
            </code>
          )}
          <button
            onClick={reset}
            style={{
              background: '#0d9488',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.75rem',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
