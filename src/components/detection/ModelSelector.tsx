"use client";

import type { DetectorType } from "@/lib/detectors/types";
import { DETECTOR_LABELS } from "@/lib/detectors/types";

interface ModelSelectorProps {
  selected: DetectorType[];
  onChange: (selected: DetectorType[]) => void;
  disabled?: boolean;
}

const ALL_DETECTORS: DetectorType[] = [
  "face_detector",
  "face_landmarker",
  "hand_landmarker",
  "pose_landmarker",
  "object_detector",
  "gesture_recognizer",
];

export function ModelSelector({
  selected,
  onChange,
  disabled,
}: ModelSelectorProps) {
  const toggle = (key: DetectorType) => {
    if (selected.includes(key)) {
      onChange(selected.filter((s) => s !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">Detectors</label>
      <div className="flex flex-wrap gap-2">
        {ALL_DETECTORS.map((key) => {
          const active = selected.includes(key);
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => toggle(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                active
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
              } disabled:opacity-50`}
            >
              {DETECTOR_LABELS[key]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
