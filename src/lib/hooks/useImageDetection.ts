"use client";

import { useState, useCallback, useRef } from "react";
import type { DetectionResults, DetectorType } from "@/lib/detectors/types";
import { detectFaces } from "@/lib/detectors/face-detector";
import { detectFaceLandmarks } from "@/lib/detectors/face-landmarker";
import { detectHandLandmarks } from "@/lib/detectors/hand-landmarker";
import { detectPoseLandmarks } from "@/lib/detectors/pose-landmarker";
import { detectObjects } from "@/lib/detectors/object-detector";
import { recognizeGestures } from "@/lib/detectors/gesture-recognizer";

const DETECTOR_MAP: Record<
  string,
  (input: ImageData, confidence: number) => Promise<unknown>
> = {
  face_detector: async (input, confidence) => detectFaces(input, confidence),
  face_landmarker: async (input) => detectFaceLandmarks(input),
  hand_landmarker: async (input) => detectHandLandmarks(input),
  pose_landmarker: async (input) => detectPoseLandmarks(input),
  object_detector: async (input, confidence) =>
    detectObjects(input, confidence),
  gesture_recognizer: async (input) => recognizeGestures(input),
};

export function useImageDetection() {
  const [results, setResults] = useState<DetectionResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  const detect = useCallback(
    async (
      imageData: ImageData,
      activeDetectors: DetectorType[],
      confidence: number,
    ) => {
      abortRef.current = false;
      setLoading(true);
      setError(null);
      setResults(null);

      const startTime = performance.now();

      try {
        const entries = activeDetectors
          .filter((t) => DETECTOR_MAP[t])
          .map(async (type) => {
            if (abortRef.current) return null;
            const result = await DETECTOR_MAP[type](imageData, confidence);
            return { type, result };
          });

        const settled = await Promise.all(entries);
        const elapsed = Math.round(performance.now() - startTime);

        if (abortRef.current) return;

        const combined: DetectionResults = { processingTimeMs: elapsed };

        for (const item of settled) {
          if (!item || item.result === null) continue;
          switch (item.type) {
            case "face_detector":
              combined.faceDetections =
                item.result as DetectionResults["faceDetections"];
              break;
            case "face_landmarker":
              combined.faceLandmarks =
                item.result as DetectionResults["faceLandmarks"];
              break;
            case "hand_landmarker":
              combined.handLandmarks =
                item.result as DetectionResults["handLandmarks"];
              break;
            case "pose_landmarker":
              combined.poseLandmarks =
                item.result as DetectionResults["poseLandmarks"];
              break;
            case "object_detector":
              combined.objectDetections =
                item.result as DetectionResults["objectDetections"];
              break;
            case "gesture_recognizer":
              combined.gestures = item.result as DetectionResults["gestures"];
              break;
          }
        }

        setResults(combined);
        return combined;
      } catch (e) {
        const msg =
          e instanceof Error
            ? e.message
            : e instanceof Event
              ? `Event: ${e.type}`
              : String(e);
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    abortRef.current = true;
    setResults(null);
    setError(null);
    setLoading(false);
  }, []);

  return { results, loading, error, detect, reset };
}
