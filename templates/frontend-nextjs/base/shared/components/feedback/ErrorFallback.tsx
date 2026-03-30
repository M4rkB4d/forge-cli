'use client';

interface ErrorFallbackProps {
  error: Error & { digest?: string };
  reset?: () => void;
}

export function ErrorFallback({ error, reset }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8" role="alert">
      <h2 className="text-lg font-semibold text-red-800">Something went wrong</h2>
      <p className="text-sm text-red-600">{error.message || 'An unexpected error occurred'}</p>
      {error.digest && (
        <p className="text-xs text-gray-500">Reference: {error.digest}</p>
      )}
      {reset && (
        <button
          onClick={reset}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
