"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface HistoryEntry {
  id: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  detectors: string[];
  processingTimeMs: number;
  createdAt: string;
}

interface HistoryItemProps {
  entry: HistoryEntry;
  onDelete: (id: string) => void;
}

const DETECTOR_LABELS: Record<string, string> = {
  face_detector: "Face Detection",
  face_landmarker: "Face Landmarks",
  hand_landmarker: "Hand Landmarks",
  pose_landmarker: "Pose Landmarks",
  object_detector: "Object Detection",
  image_segmenter: "Segmentation",
  gesture_recognizer: "Gesture Recognition",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HistoryItem({ entry, onDelete }: HistoryItemProps) {
  return (
    <div className="flex gap-4 p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
      {entry.thumbnailUrl && (
        <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
          <img
            src={entry.thumbnailUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">
              {formatDate(entry.createdAt)}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {entry.detectors.map((d) => (
                <Badge key={d} variant="info">
                  {DETECTOR_LABELS[d] ?? d}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href={`/results/${entry.id}`}>
              <Button size="sm" variant="outline">
                View
              </Button>
            </Link>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(entry.id)}
            >
              Delete
            </Button>
          </div>
        </div>
        <p className="mt-1 text-xs text-gray-400">
          {entry.processingTimeMs}ms processing time
        </p>
      </div>
    </div>
  );
}
