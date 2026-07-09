"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import type { DetectionResults } from "@/lib/detectors/types";
import {
  clearCanvas,
  renderFaceDetections,
  renderFaceLandmarks,
  renderHandLandmarks,
  renderPoseLandmarks,
  renderObjectDetections,
  renderGestures,
} from "@/lib/utils/canvas";
import { Button } from "@/components/ui/Button";

interface VideoFrameResult {
  frameIndex: number;
  results: DetectionResults;
}

interface VideoPlaybackProps {
  videoUrl: string;
  frameResults: VideoFrameResult[];
  frameSkip: number;
}

export function VideoPlayback({
  videoUrl,
  frameResults,
  frameSkip,
}: VideoPlaybackProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const resultsMap = useRef(new Map<number, DetectionResults>());
  useEffect(() => {
    const map = new Map<number, DetectionResults>();
    for (const fr of frameResults) {
      map.set(fr.frameIndex, fr.results);
    }
    resultsMap.current = map;
  }, [frameResults]);

  const draw = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    clearCanvas(ctx, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const frameIndex = Math.round(video.currentTime * 30);
    const nearest = Math.round(frameIndex / frameSkip) * frameSkip;
    const results = resultsMap.current.get(nearest);
    if (results) {
      if (results.faceDetections) {
        renderFaceDetections(ctx, results.faceDetections);
      }
      if (results.faceLandmarks) {
        renderFaceLandmarks(ctx, results.faceLandmarks);
      }
      if (results.handLandmarks) {
        renderHandLandmarks(ctx, results.handLandmarks);
      }
      if (results.poseLandmarks) {
        renderPoseLandmarks(ctx, results.poseLandmarks);
      }
      if (results.objectDetections) {
        renderObjectDetections(ctx, results.objectDetections);
      }
      if (results.gestures) {
        renderGestures(ctx, results.gestures);
      }
    }

    setCurrentTime(video.currentTime);
  }, [frameSkip]);

  const loop = useCallback(() => {
    draw();
    rafRef.current = requestAnimationFrame(loop);
  }, [draw]);

  useEffect(() => {
    if (playing) {
      videoRef.current?.play();
      rafRef.current = requestAnimationFrame(loop);
    } else {
      videoRef.current?.pause();
      cancelAnimationFrame(rafRef.current);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, loop]);

  const togglePlay = useCallback(() => {
    setPlaying((p) => !p);
  }, []);

  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const t = parseFloat(e.target.value);
      const video = videoRef.current;
      if (video) {
        video.currentTime = t;
        setCurrentTime(t);
        draw();
      }
    },
    [draw],
  );

  const handleMetadata = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      setDuration(video.duration);
      const w = video.videoWidth;
      const h = video.videoHeight;
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = w;
        canvas.height = h;
      }
    }
  }, []);

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-3">
      <div className="relative bg-black rounded-xl overflow-hidden">
        <video
          ref={videoRef}
          src={videoUrl}
          className="hidden"
          onLoadedMetadata={handleMetadata}
          onEnded={() => setPlaying(false)}
          playsInline
        />
        <canvas ref={canvasRef} className="w-full h-auto rounded-lg" />
      </div>

      <div className="flex items-center gap-3">
        <Button size="sm" variant="outline" onClick={togglePlay}>
          {playing ? "Pause" : "Play"}
        </Button>

        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.01}
          value={currentTime}
          onChange={handleSeek}
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          style={{
            background: duration
              ? `linear-gradient(to right, #2563eb 0%, #2563eb ${(currentTime / duration) * 100}%, #e5e7eb ${(currentTime / duration) * 100}%, #e5e7eb 100%)`
              : undefined,
          }}
        />

        <span className="text-sm text-gray-500 min-w-[90px] text-right tabular-nums">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}
