from __future__ import annotations

from pathlib import Path

import numpy as np
import pytest

from src.config import Config


@pytest.fixture
def test_config() -> Config:
    return Config()


@pytest.fixture
def blank_image() -> np.ndarray:
    return np.zeros((480, 640, 3), dtype=np.uint8)


@pytest.fixture
def color_image() -> np.ndarray:
    return np.ones((480, 640, 3), dtype=np.uint8) * 128


@pytest.fixture
def test_image_path(tmp_path: Path) -> Path:
    import cv2
    path = tmp_path / "test_image.jpg"
    img = np.ones((100, 100, 3), dtype=np.uint8) * 200
    cv2.imwrite(str(path), img)
    return path


@pytest.fixture
def test_video_path(tmp_path: Path) -> Path:
    import cv2
    path = tmp_path / "test_video.mp4"
    out = cv2.VideoWriter(str(path), cv2.VideoWriter_fourcc(*"mp4v"), 10, (64, 48))
    for _ in range(5):
        out.write(np.ones((48, 64, 3), dtype=np.uint8) * 200)
    out.release()
    return path
