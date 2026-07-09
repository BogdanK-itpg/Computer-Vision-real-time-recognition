"use client";

import { useCallback, useRef, useState } from "react";
import { validateVideoFile } from "@/lib/utils/file";
import { Alert } from "@/components/ui/Alert";

interface VideoUploaderProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function VideoUploader({ onFileSelect, disabled }: VideoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(
    (file: File) => {
      setError(null);
      const validation = validateVideoFile(file);
      if (!validation.valid) {
        setError(validation.error ?? "Invalid file");
        return;
      }
      onFileSelect(file);
    },
    [onFileSelect],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400 bg-gray-50"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4"
          onChange={handleChange}
          className="hidden"
          disabled={disabled}
        />
        <div className="space-y-2">
          <div className="text-4xl">+</div>
          <p className="text-sm font-medium text-gray-700">
            Drop a video here or click to browse
          </p>
          <p className="text-xs text-gray-500">MP4 up to 100MB</p>
        </div>
      </div>
      {error && <Alert variant="error">{error}</Alert>}
    </div>
  );
}
