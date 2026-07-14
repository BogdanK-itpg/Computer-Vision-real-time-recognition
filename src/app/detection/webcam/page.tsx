"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { DetectorType } from "@/lib/detectors/types";
import { useWebcamDetection } from "@/lib/hooks/useWebcamDetection";
import { useModelManager } from "@/lib/hooks/useModelManager";
import { WebcamView } from "@/components/detection/WebcamView";
import { DetectionCanvas } from "@/components/detection/DetectionCanvas";
import { ModelSelector } from "@/components/detection/ModelSelector";
import { ConfidenceSlider } from "@/components/detection/ConfidenceSlider";
import { ResultPanel } from "@/components/detection/ResultPanel";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";

export default function WebcamDetectionPage() {
  const {
    results,
    active,
    error,
    onFrame,
    startDetection,
    stopDetection,
    setActiveDetectors,
    setConfidence,
    reset,
  } = useWebcamDetection();

  const {
    initialize,
    loadModels,
    wasmInitialized,
    error: wasmError,
  } = useModelManager();
  const [activeDetectors, setActiveDetectorsState] = useState<DetectorType[]>([
    "face_detector",
  ]);
  const [confidence, setConfidenceState] = useState(0.5);
  const [capturedFrame, setCapturedFrame] = useState<ImageData | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setActiveDetectors(activeDetectors);
  }, [activeDetectors, setActiveDetectors]);

  useEffect(() => {
    setConfidence(confidence);
  }, [confidence, setConfidence]);

  const handleToggleDetection = useCallback(async () => {
    if (active) {
      stopDetection();
      setCapturedFrame(null);
    } else {
      if (!wasmInitialized) {
        await initialize();
      }
      await loadModels(activeDetectors);
      startDetection();
    }
  }, [
    active,
    wasmInitialized,
    initialize,
    loadModels,
    activeDetectors,
    startDetection,
    stopDetection,
  ]);

  const handleFrame = useCallback(
    (video: HTMLVideoElement) => {
      videoRef.current = video;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0);
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setCapturedFrame(frame);
      onFrame(video);
    },
    [onFrame],
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Webcam Detection</h1>
        <p className="mt-1 text-sm text-gray-500">
          Real-time detection using your camera.
        </p>
      </div>

      {wasmError && (
        <Alert variant="error" title="Initialization Error" className="mb-6">
          {wasmError}
        </Alert>
      )}
      {error && (
        <Alert variant="error" title="Detection Error" className="mb-6">
          {error}
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Camera</CardTitle>
            </CardHeader>
            <CardContent>
              <WebcamView onFrame={handleFrame} active={active} />
            </CardContent>
          </Card>

          {capturedFrame && (
            <Card>
              <CardHeader>
                <CardTitle>Detection Overlay</CardTitle>
              </CardHeader>
              <CardContent>
                <DetectionCanvas
                  imageData={capturedFrame}
                  results={results}
                  width={capturedFrame.width}
                  height={capturedFrame.height}
                />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                className="w-full"
                variant={active ? "danger" : "primary"}
                onClick={handleToggleDetection}
              >
                {active ? "Stop Detection" : "Start Detection"}
              </Button>
              {active && (
                <Button className="w-full" variant="outline" onClick={reset}>
                  Reset Results
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detectors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ModelSelector
                selected={activeDetectors}
                onChange={setActiveDetectorsState}
                disabled={active}
              />
              <ConfidenceSlider
                value={confidence}
                onChange={setConfidenceState}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
              <CardDescription>
                {results
                  ? `Last frame: ${results.processingTimeMs}ms`
                  : "No data"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResultPanel
                results={results}
                activeDetectors={activeDetectors}
                loading={false}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
