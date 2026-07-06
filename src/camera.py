from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Generator, Optional

import cv2
import numpy as np

from src.config import Config

logger = logging.getLogger(__name__)


class CameraSource(ABC):
    @abstractmethod
    def open(self) -> None: ...

    @abstractmethod
    def read(self) -> Optional[np.ndarray]: ...

    @abstractmethod
    def close(self) -> None: ...

    def __enter__(self) -> CameraSource:
        self.open()
        return self

    def __exit__(self, *args: object) -> None:
        self.close()

    def frames(self) -> Generator[np.ndarray, None, None]:
        while True:
            frame = self.read()
            if frame is None:
                break
            yield frame


class WebcamSource(CameraSource):
    def __init__(self, config: Config) -> None:
        self._index = config.camera_index
        self._width = config.camera_width
        self._height = config.camera_height
        self._fps = config.camera_fps
        self._cap: Optional[cv2.VideoCapture] = None

    def open(self) -> None:
        self._cap = cv2.VideoCapture(self._index)
        self._cap.set(cv2.CAP_PROP_FRAME_WIDTH, self._width)
        self._cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self._height)
        self._cap.set(cv2.CAP_PROP_FPS, self._fps)
        if not self._cap.isOpened():
            raise RuntimeError(f"Could not open webcam (index {self._index})")
        logger.info("Opened webcam (index %d)", self._index)

    def read(self) -> Optional[np.ndarray]:
        if self._cap is None:
            return None
        ret, frame = self._cap.read()
        if not ret:
            return None
        return cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    def close(self) -> None:
        if self._cap is not None:
            self._cap.release()
            self._cap = None
            logger.info("Closed webcam")


class ImageFileSource(CameraSource):
    def __init__(self, path: Path) -> None:
        self._path = path
        self._image: Optional[np.ndarray] = None
        self._read = False

    def open(self) -> None:
        image = cv2.imread(str(self._path))
        if image is None:
            raise FileNotFoundError(f"Could not load image: {self._path}")
        self._image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        logger.info("Loaded image: %s", self._path)

    def read(self) -> Optional[np.ndarray]:
        if self._read or self._image is None:
            return None
        self._read = True
        return self._image

    def close(self) -> None:
        self._image = None
        logger.info("Closed image source")


class VideoFileSource(CameraSource):
    def __init__(self, path: Path) -> None:
        self._path = path
        self._cap: Optional[cv2.VideoCapture] = None

    def open(self) -> None:
        self._cap = cv2.VideoCapture(str(self._path))
        if not self._cap.isOpened():
            raise RuntimeError(f"Could not open video: {self._path}")
        logger.info("Opened video: %s", self._path)

    def read(self) -> Optional[np.ndarray]:
        if self._cap is None:
            return None
        ret, frame = self._cap.read()
        if not ret:
            return None
        return cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    def close(self) -> None:
        if self._cap is not None:
            self._cap.release()
            self._cap = None
            logger.info("Closed video source")


def create_source(config: Config) -> CameraSource:
    if config.video_path is not None:
        return VideoFileSource(config.video_path)
    if config.image_path is not None:
        return ImageFileSource(config.image_path)
    return WebcamSource(config)
