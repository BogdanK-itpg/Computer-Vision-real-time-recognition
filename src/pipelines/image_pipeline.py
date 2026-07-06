from __future__ import annotations

import logging
from pathlib import Path

import cv2
import numpy as np

from src.camera import ImageFileSource
from src.config import Config
from src.detectors.face_detector import FaceDetector
from src.detectors.face_landmarker import FaceLandmarker
from src.detectors.hand_landmarker import HandLandmarker
from src.detectors.pose_landmarker import PoseLandmarker
from src.detectors.object_detector import ObjectDetector
from src.detectors.image_segmenter import ImageSegmenter
from src.detectors.gesture_recognizer import GestureRecognizer
from src.pipelines.base_pipeline import BasePipeline
from src.visualization import (
    draw_rectangle,
    draw_text,
    draw_landmarks,
    display_image,
)

logger = logging.getLogger(__name__)


class ImagePipeline(BasePipeline):
    def __init__(self, config: Config) -> None:
        super().__init__(config)
        self._image_path = config.image_path
        if self._image_path is None:
            raise ValueError("image_path must be set in config for ImagePipeline")

    def run(self) -> None:
        path = self._image_path
        assert path is not None
        logger.info("Image pipeline started: %s", path)

        with ImageFileSource(path) as source:
            image = source.read()
            if image is None:
                logger.error("Failed to read image: %s", path)
                return

            annotated = self._run_detectors(image)

            output_name = f"annotated_{path.stem}.jpg"
            self._save_output(annotated, output_name)

            display_image(annotated, window_name="Image Pipeline")

        logger.info("Image pipeline finished")

    def _run_detectors(self, image: np.ndarray) -> np.ndarray:
        annotated = image.copy()

        try:
            fd = FaceDetector(self._config)
            fd.initialize()
            detections = fd.detect(image)
            for det in detections:
                x, y, w, h = det.bounding_box
                annotated = draw_rectangle(annotated, (x, y, w, h), (0, 255, 0))
                annotated = draw_text(
                    annotated, f"Face: {det.score:.2f}",
                    (x, max(y - 5, 0)), (0, 255, 0),
                )
                for kp_x, kp_y in det.keypoints:
                    cx, cy = int(kp_x * image.shape[1]), int(kp_y * image.shape[0])
                    cv2.circle(annotated, (cx, cy), 3, (0, 255, 0), -1)
            fd.close()
        except Exception as e:
            logger.warning("Face detector failed: %s", e)

        try:
            fl = FaceLandmarker(self._config)
            fl.initialize()
            result = fl.detect(image)
            if result is not None:
                for landmarks in result.face_landmarks:
                    pts = [(lm[0], lm[1]) for lm in landmarks]
                    annotated = draw_landmarks(annotated, pts, (255, 0, 0), 1)
            fl.close()
        except Exception as e:
            logger.warning("Face landmarker failed: %s", e)

        try:
            hl = HandLandmarker(self._config)
            hl.initialize()
            result = hl.detect(image)
            if result is not None:
                for landmarks in result.hand_landmarks:
                    pts = [(lm[0], lm[1]) for lm in landmarks]
                    annotated = draw_landmarks(annotated, pts, (0, 255, 255), 2)
            hl.close()
        except Exception as e:
            logger.warning("Hand landmarker failed: %s", e)

        try:
            pl = PoseLandmarker(self._config)
            pl.initialize()
            result = pl.detect(image)
            if result is not None:
                for landmarks in result.pose_landmarks:
                    pts = [(lm[0], lm[1]) for lm in landmarks]
                    annotated = draw_landmarks(annotated, pts, (255, 255, 0), 2)
            pl.close()
        except Exception as e:
            logger.warning("Pose landmarker failed: %s", e)

        try:
            od = ObjectDetector(self._config)
            od.initialize()
            objs = od.detect(image)
            for obj in objs:
                x, y, w, h = obj.bounding_box
                annotated = draw_rectangle(annotated, (x, y, w, h), (0, 0, 255))
                annotated = draw_text(
                    annotated, f"{obj.category_name}: {obj.score:.2f}",
                    (x, max(y - 5, 0)), (0, 0, 255),
                )
            od.close()
        except Exception as e:
            logger.warning("Object detector failed: %s", e)

        try:
            gr = GestureRecognizer(self._config)
            gr.initialize()
            gestures = gr.recognize(image)
            for gesture in gestures:
                annotated = draw_text(
                    annotated,
                    f"{gesture.gesture_name} ({gesture.handedness}): {gesture.score:.2f}",
                    (10, 60), (255, 0, 255),
                )
            gr.close()
        except Exception as e:
            logger.warning("Gesture recognizer failed: %s", e)

        return annotated
