from __future__ import annotations

import numpy as np
import pytest

from src.config import Config
from src.detectors.face_detector import FaceDetector
from src.detectors.face_landmarker import FaceLandmarker
from src.detectors.hand_landmarker import HandLandmarker
from src.detectors.pose_landmarker import PoseLandmarker
from src.detectors.object_detector import ObjectDetector
from src.detectors.image_segmenter import ImageSegmenter
from src.detectors.gesture_recognizer import GestureRecognizer


class TestFaceDetector:
    def test_initialize(self) -> None:
        detector = FaceDetector(Config())
        detector.initialize()
        assert detector._detector is not None
        detector.close()

    def test_detect_blank_image(self, blank_image: np.ndarray) -> None:
        detector = FaceDetector(Config())
        detector.initialize()
        results = detector.detect(blank_image)
        assert isinstance(results, list)
        detector.close()

    def test_detect_without_initialize(self) -> None:
        detector = FaceDetector(Config())
        with pytest.raises(RuntimeError):
            detector.detect(np.zeros((100, 100, 3), dtype=np.uint8))

    def test_detect_output_structure(self, blank_image: np.ndarray) -> None:
        detector = FaceDetector(Config())
        detector.initialize()
        results = detector.detect(blank_image)
        for det in results:
            assert len(det.bounding_box) == 4
            assert len(det.keypoints) > 0
            assert 0.0 <= det.score <= 1.0
        detector.close()

    def test_close_idempotent(self) -> None:
        detector = FaceDetector(Config())
        detector.initialize()
        detector.close()
        detector.close()


class TestFaceLandmarker:
    def test_initialize(self) -> None:
        detector = FaceLandmarker(Config())
        detector.initialize()
        assert detector._landmarker is not None
        detector.close()

    def test_detect_blank_image(self, blank_image: np.ndarray) -> None:
        detector = FaceLandmarker(Config())
        detector.initialize()
        result = detector.detect(blank_image)
        assert result is None
        detector.close()

    def test_detect_without_initialize(self) -> None:
        detector = FaceLandmarker(Config())
        with pytest.raises(RuntimeError):
            detector.detect(np.zeros((100, 100, 3), dtype=np.uint8))


class TestHandLandmarker:
    def test_initialize(self) -> None:
        detector = HandLandmarker(Config())
        detector.initialize()
        detector.close()

    def test_detect_blank_image(self, blank_image: np.ndarray) -> None:
        detector = HandLandmarker(Config())
        detector.initialize()
        result = detector.detect(blank_image)
        assert result is None
        detector.close()

    def test_detect_without_initialize(self) -> None:
        detector = HandLandmarker(Config())
        with pytest.raises(RuntimeError):
            detector.detect(np.zeros((100, 100, 3), dtype=np.uint8))


class TestPoseLandmarker:
    def test_initialize(self) -> None:
        detector = PoseLandmarker(Config())
        detector.initialize()
        detector.close()

    def test_detect_blank_image(self, blank_image: np.ndarray) -> None:
        detector = PoseLandmarker(Config())
        detector.initialize()
        result = detector.detect(blank_image)
        assert result is None
        detector.close()


class TestObjectDetector:
    def test_initialize(self) -> None:
        detector = ObjectDetector(Config())
        detector.initialize()
        detector.close()

    def test_detect_blank_image(self, blank_image: np.ndarray) -> None:
        detector = ObjectDetector(Config())
        detector.initialize()
        results = detector.detect(blank_image)
        assert isinstance(results, list)
        detector.close()

    def test_output_structure(self, blank_image: np.ndarray) -> None:
        detector = ObjectDetector(Config())
        detector.initialize()
        results = detector.detect(blank_image)
        for obj in results:
            assert len(obj.bounding_box) == 4
            assert isinstance(obj.category_name, str)
            assert 0.0 <= obj.score <= 1.0
        detector.close()


class TestImageSegmenter:
    def test_initialize(self) -> None:
        segmenter = ImageSegmenter(Config())
        segmenter.initialize()
        segmenter.close()

    def test_segment_blank_image(self, blank_image: np.ndarray) -> None:
        segmenter = ImageSegmenter(Config())
        segmenter.initialize()
        result = segmenter.segment(blank_image)
        assert result is not None
        assert len(result.confidence_masks) > 0
        segmenter.close()

    def test_segment_output_shape(self, blank_image: np.ndarray) -> None:
        segmenter = ImageSegmenter(Config())
        segmenter.initialize()
        result = segmenter.segment(blank_image)
        if result is not None:
            for mask in result.confidence_masks:
                assert mask.shape[:2] == blank_image.shape[:2]
        segmenter.close()


class TestGestureRecognizer:
    def test_initialize(self) -> None:
        recognizer = GestureRecognizer(Config())
        recognizer.initialize()
        recognizer.close()

    def test_recognize_blank_image(self, blank_image: np.ndarray) -> None:
        recognizer = GestureRecognizer(Config())
        recognizer.initialize()
        results = recognizer.recognize(blank_image)
        assert isinstance(results, list)
        recognizer.close()

    def test_output_structure(self, blank_image: np.ndarray) -> None:
        recognizer = GestureRecognizer(Config())
        recognizer.initialize()
        results = recognizer.recognize(blank_image)
        for g in results:
            assert isinstance(g.gesture_name, str)
            assert 0.0 <= g.score <= 1.0
            assert isinstance(g.handedness, str)
        recognizer.close()
