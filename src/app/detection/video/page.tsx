"use client";

import { useState, useCallback, useRef } from "react";
import type { DetectorType } from "@/lib/detectors/types";
import { useVideoDetection } from "@/lib/hooks/useVideoDetection";
import { useModelManager } from "@/lib/hooks/useModelManager";
import { VideoUploader } from "@/components/detection/VideoUploader";
import { DetectionCanvas } from "@/components/detection/DetectionCanvas";
import { ModelSelector } from "@/components/detection/ModelSelector";
import { ConfidenceSlider } from "@/components/detection/ConfidenceSlider";
import { ResultPanel } from "@/components/detection/ResultPanel";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";

export default function VideoDetectionPage() {
  const { frameResults, loading, progress, error, processVideo, cancel, reset } = useVideoDetection();
  const { initialize, wasmInitialized, error: wasmError } = useModelManager();

  const [activeDetectors, setActiveDetectors] = useState<DetectorType[]>(["face_detector"]);
  const [confidence, setConfidence] = useState(0.5);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [frameSkip] = useState(5);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [thumbnail, setThumbnail] = useState<ImageData | null>(null);

  const handleFileSelect = useCallback(
    async (file: File) => {
      setSelectedFile(file);
      reset();
      setCurrentFrameIndex(0);
      setThumbnail(null);

      if (!wasmInitialized) {
        await initialize();
      }

      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.src = url;
      videoRef.current = video;

      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => resolve();
      });

      video.currentTime = 0;
      await new Promise<void>((resolve) => {
        video.onseeked = () => resolve();
      });

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        setThumbnail(ctx.getImageData(0, 0, canvas.width, canvas.height));
      }
    },
    [reset, wasmInitialized, initialize],
  );

  const handleProcess = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !selectedFile) return;

    if (!wasmInitialized) {
      await initialize();
    }

    await processVideo(video, activeDetectors, confidence, frameSkip);
  }, [videoRef, selectedFile, wasmInitialized, initialize, processVideo, activeDetectors, confidence, frameSkip]);

  const currentResults = frameResults[currentFrameIndex]?.results ?? null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Video Detection</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload a video file for frame-by-frame detection.
        </p>
      </div>

      {wasmError && <Alert variant="error" title="Initialization Error" className="mb-6">{wasmError}</Alert>}
      {error && <Alert variant="error" title="Processing Error" className="mb-6">{error}</Alert>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <VideoUploader onFileSelect={handleFileSelect} disabled={loading} />
            </CardContent>
          </Card>

          {thumbnail && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {currentResults ? `Frame ${currentFrameIndex + 1}` : "Preview"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DetectionCanvas
                  imageData={thumbnail}
                  results={currentResults}
                  width={thumbnail.width}
                  height={thumbnail.height}
                />
              </CardContent>
            </Card>
          )}

          {frameResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Frame Navigation</CardTitle>
                <CardDescription>
                  {frameResults.length} frames processed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentFrameIndex === 0}
                    onClick={() => setCurrentFrameIndex((i) => Math.max(0, i - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600 min-w-[100px] text-center">
                    Frame {currentFrameIndex + 1} of {frameResults.length}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentFrameIndex >= frameResults.length - 1}
                    onClick={() => setCurrentFrameIndex((i) => Math.min(frameResults.length - 1, i + 1))}
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ModelSelector
                selected={activeDetectors}
                onChange={setActiveDetectors}
                disabled={loading}
              />
              <ConfidenceSlider value={confidence} onChange={setConfidence} />
              <Button
                className="w-full"
                onClick={handleProcess}
                disabled={!selectedFile || loading}
                loading={loading}
              >
                {loading ? `Processing (${Math.round(progress)}%)` : "Process Video"}
              </Button>
              {loading && (
                <Button className="w-full" variant="outline" onClick={cancel}>
                  Cancel
                </Button>
              )}
              {!loading && frameResults.length > 0 && (
                <Button className="w-full" variant="ghost" onClick={reset}>
                  Clear Results
                </Button>
              )}
              {loading && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Frame Results</CardTitle>
              <CardDescription>
                {currentResults ? `${currentResults.processingTimeMs}ms` : "No data"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResultPanel
                results={currentResults}
                activeDetectors={activeDetectors}
                loading={loading}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
