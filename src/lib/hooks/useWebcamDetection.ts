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
  (input: HTMLVideoElement, confidence: number) => Promise<unknown>
> = {
  face_detector: async (input, confidence) => detectFaces(input, confidence),
  face_landmarker: async (input) => detectFaceLandmarks(input),
  hand_landmarker: async (input) => detectHandLandmarks(input),
  pose_landmarker: async (input) => detectPoseLandmarks(input),
  object_detector: async (input, confidence) =>
    detectObjects(input, confidence),
  gesture_recognizer: async (input) => recognizeGestures(input),
};

export function useWebcamDetection() {
  const [results, setResults] = useState<DetectionResults | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectorsRef = useRef<DetectorType[]>([]);
  const confidenceRef = useRef(0.5);
  const fpsRef = useRef({ frames: 0, lastTime: 0, fps: 0 });
  const lastFrameTimeRef = useRef(0);

  const setActiveDetectors = useCallback((types: DetectorType[]) => {
    detectorsRef.current = types;
  }, []);

  const setConfidence = useCallback((value: number) => {
    confidenceRef.current = value;
  }, []);

  const processFrame = useCallback(async (video: HTMLVideoElement) => {
    try {
      const now = performance.now();
      lastFrameTimeRef.current = now;

      const fps = fpsRef.current;
      if (fps.lastTime === 0) fps.lastTime = now;
      fps.frames++;
      if (now - fps.lastTime >= 1000) {
        fps.fps = fps.frames;
        fps.frames = 0;
        fps.lastTime = now;
      }

      const startTime = now;
      const types = detectorsRef.current;

      const detectorPromises = types
        .filter((t) => DETECTOR_MAP[t])
        .map(async (type) => {
          const result = await DETECTOR_MAP[type](video, confidenceRef.current);
          return { type, result };
        });

      const settled = await Promise.all(detectorPromises);
      const elapsed = Math.round(performance.now() - startTime);

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

      combined.processingTimeMs = elapsed;
      setResults(combined);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : e instanceof Event
            ? `Event: ${e.type}`
            : String(e),
      );
    }
  }, []);

  const onFrame = useCallback(
    (video: HTMLVideoElement) => {
      processFrame(video);
    },
    [processFrame],
  );

  const startDetection = useCallback(() => {
    setActive(true);
    setError(null);
  }, []);

  const stopDetection = useCallback(() => {
    setActive(false);
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stopDetection();
    setResults(null);
    setError(null);
  }, [stopDetection]);

  return {
    results,
    active,
    error,
    onFrame,
    startDetection,
    stopDetection,
    setActiveDetectors,
    setConfidence,
    reset,
  };
}
