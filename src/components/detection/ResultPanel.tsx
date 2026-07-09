import type { DetectionResults } from "@/lib/detectors/types";
import { DETECTOR_LABELS } from "@/lib/detectors/types";
import { Badge } from "@/components/ui/Badge";

interface ResultPanelProps {
  results: DetectionResults | null;
  activeDetectors: string[];
  loading?: boolean;
}

function getResultSummary(
  results: DetectionResults,
): Array<{
  key: string;
  label: string;
  count: number;
  variant: "success" | "error" | "info";
}> {
  const items: Array<{
    key: string;
    label: string;
    count: number;
    variant: "success" | "error" | "info";
  }> = [];

  if (results.faceDetections) {
    items.push({
      key: "face_detector",
      label: DETECTOR_LABELS.face_detector,
      count: results.faceDetections.length,
      variant: "success",
    });
  }
  if (results.faceLandmarks) {
    items.push({
      key: "face_landmarker",
      label: DETECTOR_LABELS.face_landmarker,
      count: results.faceLandmarks.faceLandmarks.length,
      variant: "success",
    });
  }
  if (results.handLandmarks) {
    items.push({
      key: "hand_landmarker",
      label: DETECTOR_LABELS.hand_landmarker,
      count: results.handLandmarks.handLandmarks.length,
      variant: "success",
    });
  }
  if (results.poseLandmarks) {
    items.push({
      key: "pose_landmarker",
      label: DETECTOR_LABELS.pose_landmarker,
      count: results.poseLandmarks.poseLandmarks.length,
      variant: "success",
    });
  }
  if (results.objectDetections) {
    items.push({
      key: "object_detector",
      label: DETECTOR_LABELS.object_detector,
      count: results.objectDetections.length,
      variant: "success",
    });
  }
  if (results.gestures) {
    items.push({
      key: "gesture_recognizer",
      label: DETECTOR_LABELS.gesture_recognizer,
      count: results.gestures.length,
      variant: "success",
    });
  }

  return items;
}

export function ResultPanel({
  results,
  activeDetectors,
  loading,
}: ResultPanelProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">Processing...</h3>
        <div className="animate-pulse space-y-2">
          {activeDetectors.map((d) => (
            <div key={d} className="h-8 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="text-sm text-gray-500">
        No results yet. Upload an image and click Process to start detection.
      </div>
    );
  }

  const summary = getResultSummary(results);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Detection Results</h3>
        <span className="text-xs text-gray-400">
          {results.processingTimeMs}ms
        </span>
      </div>

      <div className="space-y-2">
        {summary.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between py-1.5 px-3 bg-gray-50 rounded-lg"
          >
            <span className="text-sm text-gray-700">{item.label}</span>
            <Badge variant={item.variant}>{item.count} detected</Badge>
          </div>
        ))}
      </div>

      {summary.length === 0 && (
        <p className="text-sm text-gray-500">No detections found.</p>
      )}
    </div>
  );
}
