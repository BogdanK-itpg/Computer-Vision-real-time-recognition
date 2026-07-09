"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";

interface WebcamViewProps {
  onFrame: (video: HTMLVideoElement) => void;
  active?: boolean;
  width?: number;
  height?: number;
}

export function WebcamView({
  onFrame,
  active = false,
  width = 640,
  height = 480,
}: WebcamViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<
    "idle" | "starting" | "active" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: width },
          height: { ideal: height },
          facingMode: "user",
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraState("active");
    } catch (err) {
      setCameraState("error");
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setErrorMsg(
          "Camera access denied. Please allow camera permissions in your browser settings.",
        );
      } else if (err instanceof DOMException && err.name === "NotFoundError") {
        setErrorMsg("No camera found. Please connect a camera and try again.");
      } else {
        setErrorMsg("Failed to access camera.");
      }
    }
  }, [width, height]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraState("idle");
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (cameraState !== "active") return;
    let running = true;
    const loop = () => {
      if (!running) return;
      if (videoRef.current && videoRef.current.readyState >= 2) {
        onFrame(videoRef.current);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    return () => {
      running = false;
    };
  }, [cameraState, onFrame]);

  return (
    <div className="space-y-3">
      <div
        className="relative bg-black rounded-xl overflow-hidden"
        style={{ maxWidth: width }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full ${cameraState === "active" ? "" : "hidden"}`}
        />
        {cameraState === "idle" && (
          <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
            Camera idle
          </div>
        )}
        {cameraState === "starting" && (
          <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
            Starting camera...
          </div>
        )}
        {cameraState === "error" && (
          <div className="flex items-center justify-center h-64 text-red-400 text-sm px-4 text-center">
            {errorMsg ?? "Camera error"}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {cameraState !== "active" ? (
          <Button onClick={startCamera} loading={cameraState === "starting"}>
            Start Camera
          </Button>
        ) : (
          <Button variant="danger" onClick={stopCamera}>
            Stop Camera
          </Button>
        )}
      </div>
    </div>
  );
}
