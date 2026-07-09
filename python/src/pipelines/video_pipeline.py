from __future__ import annotations

import logging
import time
from pathlib import Path

import cv2
import numpy as np

from src.camera import VideoFileSource
from src.config import Config
from src.detectors.face_detector import FaceDetector
from src.detectors.object_detector import ObjectDetector
from src.pipelines.base_pipeline import BasePipeline
from src.visualization import draw_rectangle, draw_text

logger = logging.getLogger(__name__)


class VideoPipeline(BasePipeline):
    def __init__(self, config: Config) -> None:
        super().__init__(config)
        self._video_path = config.video_path
        if self._video_path is None:
            raise ValueError("video_path must be set in config for VideoPipeline")

    def run(self) -> None:
        path = self._video_path
        assert path is not None
        logger.info("Video pipeline started: %s", path)

        fd = FaceDetector(self._config)
        od = ObjectDetector(self._config)
        fd.initialize()
        od.initialize()

        frames: list[np.ndarray] = []
        frame_count = 0
        start = time.perf_counter()
        skip = self._config.frame_skip

        with VideoFileSource(path) as source:
            for frame in source.frames():
                if skip > 0 and frame_count % (skip + 1) != 0:
                    frame_count += 1
                    continue
                frame_count += 1
                annotated = self._annotate_frame(frame, fd, od)
                frames.append(annotated)

        elapsed = time.perf_counter() - start
        fps = frame_count / elapsed if elapsed > 0 else 0
        logger.info("Processed %d frames (kept %d) at %.1f FPS", frame_count, len(frames), fps)

        if frames:
            output_name = f"processed_{path.stem}.mp4"
            self._write_video(frames, output_name, fps)

        fd.close()
        od.close()

    def _annotate_frame(
        self,
        frame: np.ndarray,
        fd: FaceDetector,
        od: ObjectDetector,
    ) -> np.ndarray:
        annotated = frame.copy()

        try:
            detections = fd.detect(frame)
            for det in detections:
                x, y, w, h = det.bounding_box
                annotated = draw_rectangle(annotated, (x, y, w, h), (0, 255, 0))
                annotated = draw_text(
                    annotated, f"Face: {det.score:.2f}",
                    (x, max(y - 5, 0)), (0, 255, 0),
                )
        except Exception as e:
            logger.warning("Face detector: %s", e)

        try:
            objs = od.detect(frame)
            for obj in objs:
                x, y, w, h = obj.bounding_box
                annotated = draw_rectangle(annotated, (x, y, w, h), (0, 0, 255))
                annotated = draw_text(
                    annotated, f"{obj.category_name}: {obj.score:.2f}",
                    (x, max(y - 5, 0)), (0, 0, 255),
                )
        except Exception as e:
            logger.warning("Object detector: %s", e)

        return annotated

    def _write_video(self, frames: list[np.ndarray], filename: str, target_fps: float) -> Path:
        if not frames:
            raise ValueError("No frames to write")

        output_path = self._config.output_dir / filename
        output_path.parent.mkdir(parents=True, exist_ok=True)

        h, w = frames[0].shape[:2]
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(str(output_path), fourcc, target_fps, (w, h))

        for frame in frames:
            writer.write(cv2.cvtColor(frame, cv2.COLOR_RGB2BGR))

        writer.release()
        logger.info("Saved video: %s (%d frames, %.1f FPS)", output_path, len(frames), target_fps)
        return output_path
