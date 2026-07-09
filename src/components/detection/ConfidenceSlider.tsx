"use client";

import { Slider } from "@/components/ui/Slider";

interface ConfidenceSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function ConfidenceSlider({ value, onChange }: ConfidenceSliderProps) {
  return (
    <Slider
      label="Confidence Threshold"
      value={value}
      min={0}
      max={1}
      step={0.05}
      onChange={onChange}
      formatValue={(v) => `${Math.round(v * 100)}%`}
    />
  );
}
