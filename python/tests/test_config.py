from __future__ import annotations

from pathlib import Path

from src.config import Config


class TestConfig:
    def test_default_values(self) -> None:
        config = Config()
        assert config.camera_index == 0
        assert config.camera_width == 640
        assert config.camera_height == 480
        assert config.camera_fps == 30
        assert config.face_detection_confidence == 0.5
        assert config.max_results == 5

    def test_model_paths(self) -> None:
        config = Config()
        assert config.face_detector_model == Path("assets/models/blaze_face_short_range.tflite")
        assert config.face_landmarker_model == Path("assets/models/face_landmarker.task")
        assert config.hand_landmarker_model == Path("assets/models/hand_landmarker.task")
        assert config.pose_landmarker_model == Path("assets/models/pose_landmarker.task")
        assert config.object_detector_model == Path("assets/models/object_detector.task")
        assert config.image_segmenter_model == Path("assets/models/image_segmenter.task")
        assert config.gesture_recognizer_model == Path("assets/models/gesture_recognizer.task")

    def test_model_path_lookup(self) -> None:
        config = Config()
        assert config.model_path("face_detector") == config.face_detector_model
        assert config.model_path("face_landmarker") == config.face_landmarker_model
        assert config.model_path("unknown") is None

    def test_image_path_default_none(self) -> None:
        config = Config()
        assert config.image_path is None

    def test_video_path_default_none(self) -> None:
        config = Config()
        assert config.video_path is None

    def test_custom_values(self) -> None:
        config = Config(
            camera_index=1,
            camera_width=1280,
            camera_height=720,
            face_detection_confidence=0.8,
            max_results=10,
        )
        assert config.camera_index == 1
        assert config.camera_width == 1280
        assert config.camera_height == 720
        assert config.face_detection_confidence == 0.8
        assert config.max_results == 10

    def test_output_dir_creation(self, tmp_path: Path) -> None:
        custom_output = tmp_path / "custom_output"
        config = Config(output_dir=custom_output)
        assert custom_output.exists()

    def test_frame_skip_default(self) -> None:
        config = Config()
        assert config.frame_skip == 0

    def test_use_gpu_default(self) -> None:
        config = Config()
        assert config.use_gpu is False

    def test_custom_frame_skip(self) -> None:
        config = Config(frame_skip=3)
        assert config.frame_skip == 3
