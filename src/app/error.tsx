"use client";

import { Button } from "@/components/ui/Button";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <h1 className="text-6xl font-bold text-gray-200">500</h1>
      <h2 className="mt-4 text-xl font-semibold text-gray-900">
        Something went wrong
      </h2>
      <p className="mt-2 text-sm text-gray-500 max-w-sm">
        An unexpected error occurred. Please try again.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>Try Again</Button>
        <Button variant="outline" onClick={() => (window.location.href = "/")}>
          Back to Home
        </Button>
      </div>
    </div>
  );
}
