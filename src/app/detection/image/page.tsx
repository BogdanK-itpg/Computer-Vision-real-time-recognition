"use client";

import { useState, useCallback, useRef } from "react";
import type { DetectorType } from "@/lib/detectors/types";
import { useImageDetection } from "@/lib/hooks/useImageDetection";
import { useModelManager } from "@/lib/hooks/useModelManager";
import { ImageUploader } from "@/components/detection/ImageUploader";
import { DetectionCanvas } from "@/components/detection/DetectionCanvas";
import { ModelSelector } from "@/components/detection/ModelSelector";
import { ConfidenceSlider } from "@/components/detection/ConfidenceSlider";
import { ResultPanel } from "@/components/detection/ResultPanel";
import { AnnotatedImage } from "@/components/detection/AnnotatedImage";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";

export default function ImageDetectionPage() {
  const { results, loading, error, detect, reset } = useImageDetection();
  const { initialize, wasmInitialized, error: wasmError } = useModelManager();

  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [activeDetectors, setActiveDetectors] = useState<DetectorType[]>([
    "face_detector",
  ]);
  const [confidence, setConfidence] = useState(0.5);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleFileSelect = useCallback(
    async (file: File, data: ImageData) => {
      setSelectedFile(file);
      setImageData(data);
      reset();
      if (!wasmInitialized) {
        await initialize();
      }
    },
    [reset, wasmInitialized, initialize],
  );

  const handleDetect = useCallback(async () => {
    if (!imageData) return;
    if (!wasmInitialized) {
      await initialize();
    }
    await detect(imageData, activeDetectors, confidence);
  }, [
    imageData,
    detect,
    activeDetectors,
    confidence,
    wasmInitialized,
    initialize,
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Image Detection</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload an image, select detectors, and run analysis.
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
              <CardTitle>Input</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUploader
                onFileSelect={handleFileSelect}
                disabled={loading}
              />
            </CardContent>
          </Card>

          {imageData && (
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <DetectionCanvas
                  canvasRef={canvasRef}
                  imageData={imageData}
                  results={results}
                  width={imageData.width}
                  height={imageData.height}
                />
              </CardContent>
            </Card>
          )}

          {results && (
            <Card>
              <CardHeader>
                <CardTitle>Annotated Result</CardTitle>
              </CardHeader>
              <CardContent>
                <AnnotatedImage
                  canvasRef={canvasRef}
                  filename={selectedFile?.name ?? "annotated-image.png"}
                />
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
                onClick={handleDetect}
                disabled={!imageData || loading}
                loading={loading}
              >
                {loading ? "Processing..." : "Run Detection"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
              <CardDescription>
                {results
                  ? `Processed in ${results.processingTimeMs}ms`
                  : "Awaiting input"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResultPanel
                results={results}
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
