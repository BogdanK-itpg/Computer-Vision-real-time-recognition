from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Optional


@dataclass(frozen=True)
class Config:
    camera_index: int = 0
    camera_width: int = 640
    camera_height: int = 480
    camera_fps: int = 30

    image_path: Optional[Path] = None
    video_path: Optional[Path] = None

    face_detector_model: Path = Path("assets/models/blaze_face_short_range.tflite")
    face_landmarker_model: Path = Path("assets/models/face_landmarker.task")
    hand_landmarker_model: Path = Path("assets/models/hand_landmarker.task")
    pose_landmarker_model: Path = Path("assets/models/pose_landmarker.task")
    object_detector_model: Path = Path("assets/models/object_detector.task")
    image_segmenter_model: Path = Path("assets/models/image_segmenter.task")
    gesture_recognizer_model: Path = Path("assets/models/gesture_recognizer.task")

    face_detection_confidence: float = 0.5
    face_landmarker_confidence: float = 0.5
    hand_landmarker_confidence: float = 0.5
    pose_landmarker_confidence: float = 0.5
    object_detection_confidence: float = 0.5
    segmentation_confidence: float = 0.5
    gesture_confidence: float = 0.5

    max_results: int = 5
    frame_skip: int = 0
    use_gpu: bool = False

    assets_dir: Path = Path("assets")
    models_dir: Path = Path("assets/models")
    images_dir: Path = Path("assets/images")
    videos_dir: Path = Path("assets/videos")
    output_dir: Path = Path("output")
    data_dir: Path = Path("data")

    logging_level: int = logging.INFO
    logging_format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    def __post_init__(self) -> None:
        for dir_path in [self.assets_dir, self.models_dir, self.images_dir,
                         self.videos_dir, self.output_dir, self.data_dir]:
            dir_path.mkdir(parents=True, exist_ok=True)

    def model_path(self, model_type: str) -> Optional[Path]:
        path_map = {
            "face_detector": self.face_detector_model,
            "face_landmarker": self.face_landmarker_model,
            "hand_landmarker": self.hand_landmarker_model,
            "pose_landmarker": self.pose_landmarker_model,
            "object_detector": self.object_detector_model,
            "image_segmenter": self.image_segmenter_model,
            "gesture_recognizer": self.gesture_recognizer_model,
        }
        return path_map.get(model_type)
