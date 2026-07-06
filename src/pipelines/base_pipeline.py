from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any, Optional

import cv2
import numpy as np

from src.camera import CameraSource
from src.config import Config
from src.mediapipe_tasks import MediaPipeTaskManager
from src.utils import setup_logging
from src.visualization import draw_fps

logger = logging.getLogger(__name__)


class BasePipeline(ABC):
    def __init__(self, config: Config) -> None:
        self._config = config
        self._task_manager = MediaPipeTaskManager(config)
        self._frame_count = 0

    @abstractmethod
    def run(self) -> None: ...

    def close(self) -> None:
        self._task_manager.close_all()

    def _process_frame(self, image: np.ndarray) -> np.ndarray:
        return image

    def _display(self, image: np.ndarray, window_name: str = "Output") -> int:
        cv2.imshow(window_name, cv2.cvtColor(image, cv2.COLOR_RGB2BGR))
        return cv2.waitKey(1)

    def _save_output(self, image: np.ndarray, filename: str) -> Path:
        output_path = self._config.output_dir / filename
        output_path.parent.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(str(output_path), cv2.cvtColor(image, cv2.COLOR_RGB2BGR))
        logger.info("Saved output: %s", output_path)
        return output_path
