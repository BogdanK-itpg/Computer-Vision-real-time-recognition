"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";

interface HistoryEntry {
  id: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  detectors: string[];
  results: unknown | null;
  processingTimeMs: number;
  createdAt: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const DETECTOR_LABELS: Record<string, string> = {
  face_detector: "Face Detection",
  face_landmarker: "Face Landmarks",
  hand_landmarker: "Hand Landmarks",
  pose_landmarker: "Pose Landmarks",
  object_detector: "Object Detection",
  image_segmenter: "Image Segmentation",
  gesture_recognizer: "Gesture Recognition",
};

export default function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const [entry, setEntry] = useState<HistoryEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/history")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const found = (data.entries ?? []).find(
          (e: HistoryEntry) => e.id === id,
        );
        if (!found) {
          setError("Result not found");
          setLoading(false);
        } else {
          setEntry(found);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Failed to load result");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Alert variant="error">{error ?? "Result not found"}</Alert>
        <Link href="/history">
          <Button variant="outline" className="mt-4">
            Back to History
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Link href="/history">
            <Button variant="ghost" size="sm">
              &larr; Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Detection Result</h1>
        </div>
        <p className="text-sm text-gray-500">{formatDate(entry.createdAt)}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Image</CardTitle>
          </CardHeader>
          <CardContent>
            {entry.imageUrl ? (
              <img
                src={entry.imageUrl}
                alt="Processed"
                className="w-full rounded-lg border border-gray-200"
              />
            ) : (
              <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center text-sm text-gray-400">
                No image
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detectors Used</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {entry.detectors.length > 0 ? (
                  entry.detectors.map((d) => (
                    <Badge key={d} variant="info">
                      {DETECTOR_LABELS[d] ?? d}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No detectors recorded</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">ID</span>
                <span className="text-gray-700 font-mono text-xs">
                  {entry.id}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Processing Time</span>
                <span className="text-gray-700">
                  {entry.processingTimeMs}ms
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Created</span>
                <span className="text-gray-700">
                  {formatDate(entry.createdAt)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
