"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { HistoryItem } from "./HistoryItem";

interface HistoryEntry {
  id: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  detectors: string[];
  processingTimeMs: number;
  createdAt: string;
}

interface HistoryListProps {
  entries: HistoryEntry[];
  loading: boolean;
  error: string | null;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export function HistoryList({
  entries,
  loading,
  error,
  onDelete,
}: HistoryListProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">
            No history yet. Process an image to see results here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <HistoryItem key={entry.id} entry={entry} onDelete={onDelete} />
      ))}
    </div>
  );
}
