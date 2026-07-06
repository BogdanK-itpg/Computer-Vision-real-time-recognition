from __future__ import annotations

import logging
import time

import cv2
import numpy as np

from src.camera import WebcamSource
from src.config import Config
from src.detectors.face_detector import FaceDetector
from src.detectors.face_landmarker import FaceLandmarker
from src.detectors.hand_landmarker import HandLandmarker
from src.detectors.pose_landmarker import PoseLandmarker
from src.detectors.object_detector import ObjectDetector
from src.detectors.gesture_recognizer import GestureRecognizer
from src.pipelines.base_pipeline import BasePipeline
from src.visualization import (
    draw_fps,
    draw_rectangle,
    draw_text,
    draw_landmarks,
)

logger = logging.getLogger(__name__)


class WebcamPipeline(BasePipeline):
    def __init__(self, config: Config) -> None:
        super().__init__(config)
        self._window_name = "Webcam Pipeline (press ESC to quit)"

    def run(self) -> None:
        logger.info("Webcam pipeline started")

        fd = FaceDetector(self._config)
        fl = FaceLandmarker(self._config)
        hl = HandLandmarker(self._config)
        pl = PoseLandmarker(self._config)
        od = ObjectDetector(self._config)
        gr = GestureRecognizer(self._config)

        fd.initialize()
        fl.initialize()
        hl.initialize()
        pl.initialize()
        od.initialize()
        gr.initialize()

        with WebcamSource(self._config) as source:
            fps_timer = time.perf_counter()
            fps_counter = 0
            frame_count = 0
            fps_display = 0.0
            skip = self._config.frame_skip

            for frame in source.frames():
                frame_count += 1
                if skip > 0 and frame_count % (skip + 1) != 0:
                    key = self._display(frame, self._window_name)
                    if key == 27:
                        break
                    continue

                fps_counter += 1
                now = time.perf_counter()
                if now - fps_timer >= 1.0:
                    fps_display = fps_counter / (now - fps_timer)
                    fps_counter = 0
                    fps_timer = now

                annotated = self._annotate_frame(frame, fd, fl, hl, pl, od, gr)
                annotated = draw_fps(annotated, fps_display)

                key = self._display(annotated, self._window_name)
                if key == 27:
                    logger.info("ESC pressed — quitting webcam pipeline")
                    break

        fd.close()
        fl.close()
        hl.close()
        pl.close()
        od.close()
        gr.close()
        logger.info("Webcam pipeline finished")

    def _annotate_frame(
        self,
        frame: np.ndarray,
        fd: FaceDetector,
        fl: FaceLandmarker,
        hl: HandLandmarker,
        pl: PoseLandmarker,
        od: ObjectDetector,
        gr: GestureRecognizer,
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
                for kp_x, kp_y in det.keypoints:
                    cx, cy = int(kp_x * frame.shape[1]), int(kp_y * frame.shape[0])
                    cv2.circle(annotated, (cx, cy), 3, (0, 255, 0), -1)
        except Exception as e:
            logger.warning("Face detector: %s", e)

        try:
            result = fl.detect(frame)
            if result is not None:
                for landmarks in result.face_landmarks:
                    pts = [(lm[0], lm[1]) for lm in landmarks]
                    annotated = draw_landmarks(annotated, pts, (255, 0, 0), 1)
        except Exception as e:
            logger.warning("Face landmarker: %s", e)

        try:
            result = hl.detect(frame)
            if result is not None:
                for landmarks in result.hand_landmarks:
                    pts = [(lm[0], lm[1]) for lm in landmarks]
                    annotated = draw_landmarks(annotated, pts, (0, 255, 255), 2)
        except Exception as e:
            logger.warning("Hand landmarker: %s", e)

        try:
            result = pl.detect(frame)
            if result is not None:
                for landmarks in result.pose_landmarks:
                    pts = [(lm[0], lm[1]) for lm in landmarks]
                    annotated = draw_landmarks(annotated, pts, (255, 255, 0), 2)
        except Exception as e:
            logger.warning("Pose landmarker: %s", e)

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

        try:
            gestures = gr.recognize(frame)
            for gesture in gestures:
                annotated = draw_text(
                    annotated,
                    f"{gesture.gesture_name} ({gesture.handedness}): {gesture.score:.2f}",
                    (10, 60), (255, 0, 255),
                )
        except Exception as e:
            logger.warning("Gesture recognizer: %s", e)

        return annotated
