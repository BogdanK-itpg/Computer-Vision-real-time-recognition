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

interface VideoFrameResult {
  frameIndex: number;
  results: DetectionResults;
}

export function useVideoDetection() {
  const [frameResults, setFrameResults] = useState<VideoFrameResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  const processVideo = useCallback(
    async (
      videoEl: HTMLVideoElement,
      activeDetectors: DetectorType[],
      confidence: number,
      frameSkip = 1,
    ) => {
      abortRef.current = false;
      setLoading(true);
      setError(null);
      setFrameResults([]);
      setProgress(0);

      const totalFrames = Math.floor(
        videoEl.duration * videoEl.playbackRate * 30,
      );
      const results: VideoFrameResult[] = [];
      let frameIndex = 0;

      try {
        videoEl.currentTime = 0;
        await videoEl.play();

        while (frameIndex < totalFrames) {
          if (abortRef.current) break;

          videoEl.currentTime = (frameIndex * frameSkip) / 30;

          await new Promise<void>((resolve) => {
            const onSeeked = () => {
              videoEl.removeEventListener("seeked", onSeeked);
              resolve();
            };
            videoEl.addEventListener("seeked", onSeeked);
          });

          if (abortRef.current) break;

          const startTime = performance.now();

          const detectorPromises = activeDetectors
            .filter((t) => DETECTOR_MAP[t])
            .map(async (type) => {
              const result = await DETECTOR_MAP[type](videoEl, confidence);
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

          results.push({ frameIndex, results: combined });
          frameIndex += frameSkip;
          setProgress(Math.min((frameIndex / totalFrames) * 100, 100));
        }

        videoEl.pause();
        setFrameResults(results);
      } catch (e) {
        const msg =
          e instanceof Error
            ? e.message
            : e instanceof Event
              ? `Event: ${e.type}`
              : String(e);
        setError(msg);
        videoEl.pause();
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const cancel = useCallback(() => {
    abortRef.current = true;
  }, []);

  const reset = useCallback(() => {
    abortRef.current = true;
    setFrameResults([]);
    setError(null);
    setLoading(false);
    setProgress(0);
  }, []);

  return {
    frameResults,
    loading,
    progress,
    error,
    processVideo,
    cancel,
    reset,
  };
}
