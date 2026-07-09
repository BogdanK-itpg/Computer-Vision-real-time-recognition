"use client";

import { useState } from "react";
import { DETECTOR_LABELS, DETECTOR_COLORS } from "@/lib/detectors/types";
import type { DetectorType } from "@/lib/detectors/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

const ALL_DETECTORS: DetectorType[] = [
  "face_detector",
  "face_landmarker",
  "hand_landmarker",
  "pose_landmarker",
  "object_detector",
  "gesture_recognizer",
];

const DEFAULT_CONFIDENCE: Record<string, number> = {
  face_detector: 0.5,
  face_landmarker: 0.5,
  hand_landmarker: 0.5,
  pose_landmarker: 0.5,
  object_detector: 0.5,
  gesture_recognizer: 0.5,
};

export default function SettingsPage() {
  const [thresholds, setThresholds] =
    useState<Record<string, number>>(DEFAULT_CONFIDENCE);
  const [frameSkip, setFrameSkip] = useState(1);

  const updateThreshold = (key: string, value: number) => {
    setThresholds((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure detector thresholds and application preferences.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Confidence Thresholds</CardTitle>
            <CardDescription>
              Set the minimum confidence score for each detector. Higher values
              reduce false positives but may miss detections.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {ALL_DETECTORS.map((key) => (
              <div key={key}>
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: DETECTOR_COLORS[key] }}
                    />
                    <label className="text-sm font-medium text-gray-700">
                      {DETECTOR_LABELS[key]}
                    </label>
                  </div>
                  <span className="text-sm text-gray-500">
                    {Math.round(thresholds[key] * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={thresholds[key]}
                  onChange={(e) =>
                    updateThreshold(key, parseFloat(e.target.value))
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  style={{
                    background: `linear-gradient(to right, #2563eb 0%, #2563eb ${thresholds[key] * 100}%, #e5e7eb ${thresholds[key] * 100}%, #e5e7eb 100%)`,
                  }}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Processing</CardTitle>
            <CardDescription>
              Adjust performance-related settings for video and webcam
              processing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Frame Skip
                </label>
                <span className="text-sm text-gray-500">{frameSkip}</span>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={frameSkip}
                onChange={(e) => setFrameSkip(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                style={{
                  background: `linear-gradient(to right, #2563eb 0%, #2563eb ${(frameSkip / 10) * 100}%, #e5e7eb ${(frameSkip / 10) * 100}%, #e5e7eb 100%)`,
                }}
              />
              <p className="mt-1 text-xs text-gray-400">
                Process every Nth frame. Higher values improve performance.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
