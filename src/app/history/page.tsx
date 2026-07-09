"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { HistoryList } from "@/components/history/HistoryList";

interface HistoryEntry {
  id: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  detectors: string[];
  processingTimeMs: number;
  createdAt: string;
}

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      setEntries(data.entries ?? []);
    } catch {
      setError("Failed to load history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/history")
      .then((res) => res.json())
      .then((data) => {
        setEntries(data.entries ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load history");
        setLoading(false);
      });
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await fetch(`/api/history/${id}`, { method: "DELETE" });
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch {
      setError("Failed to delete entry");
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">History</h1>
          <p className="mt-1 text-sm text-gray-500">
            Previously processed images and results.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadHistory}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      <HistoryList
        entries={entries}
        loading={loading}
        error={error}
        onDelete={handleDelete}
        onRefresh={loadHistory}
      />
    </div>
  );
}
