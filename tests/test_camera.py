from __future__ import annotations

from pathlib import Path

import numpy as np
import pytest

from src.camera import ImageFileSource, VideoFileSource, WebcamSource, create_source
from src.config import Config


class TestImageFileSource:
    def test_open_and_read(self, test_image_path: Path) -> None:
        source = ImageFileSource(test_image_path)
        source.open()
        image = source.read()
        assert image is not None
        assert isinstance(image, np.ndarray)
        assert image.shape == (100, 100, 3)
        source.close()

    def test_read_once(self, test_image_path: Path) -> None:
        source = ImageFileSource(test_image_path)
        source.open()
        first = source.read()
        second = source.read()
        assert first is not None
        assert second is None
        source.close()

    def test_missing_file(self) -> None:
        source = ImageFileSource(Path("nonexistent.jpg"))
        with pytest.raises(FileNotFoundError):
            source.open()

    def test_context_manager(self, test_image_path: Path) -> None:
        with ImageFileSource(test_image_path) as source:
            image = source.read()
            assert image is not None

    def test_frames_generator(self, test_image_path: Path) -> None:
        with ImageFileSource(test_image_path) as source:
            frames = list(source.frames())
            assert len(frames) == 1
            assert isinstance(frames[0], np.ndarray)


class TestVideoFileSource:
    def test_open_and_read(self, test_video_path: Path) -> None:
        with VideoFileSource(test_video_path) as source:
            frame = source.read()
            assert frame is not None
            assert isinstance(frame, np.ndarray)

    def test_frames_generator(self, test_video_path: Path) -> None:
        with VideoFileSource(test_video_path) as source:
            frames = list(source.frames())
            assert len(frames) > 0
            assert all(isinstance(f, np.ndarray) for f in frames)

    def test_missing_file(self) -> None:
        source = VideoFileSource(Path("nonexistent.mp4"))
        with pytest.raises(RuntimeError):
            source.open()


class TestCreateSource:
    def test_webcam_default(self) -> None:
        config = Config()
        source = create_source(config)
        assert isinstance(source, WebcamSource)

    def test_image_source(self, test_image_path: Path) -> None:
        config = Config(image_path=test_image_path)
        source = create_source(config)
        assert isinstance(source, ImageFileSource)

    def test_video_source(self, test_video_path: Path) -> None:
        config = Config(video_path=test_video_path)
        source = create_source(config)
        assert isinstance(source, VideoFileSource)

    def test_video_takes_precedence(self, test_image_path: Path, test_video_path: Path) -> None:
        config = Config(image_path=test_image_path, video_path=test_video_path)
        source = create_source(config)
        assert isinstance(source, VideoFileSource)
