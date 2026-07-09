from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Callable, Optional, TypeVar

import cv2
import mediapipe as mp
import numpy as np

from src.config import Config

F = TypeVar("F", bound=Callable[..., Any])

logger = logging.getLogger(__name__)


def setup_logging(config: Config) -> None:
    logging.basicConfig(
        level=config.logging_level,
        format=config.logging_format,
    )


def resolve_path(path: Path, base: Path = Path.cwd()) -> Path:
    if path.is_absolute():
        return path
    return (base / path).resolve()


def validate_model_path(model_path: Path) -> bool:
    if not model_path.exists():
        logger.error("Model file not found: %s", model_path)
        return False
    if not model_path.is_file():
        logger.error("Model path is not a file: %s", model_path)
        return False
    return True


def create_base_options(model_path: Path, use_gpu: bool = False) -> mp.tasks.BaseOptions:
    delegate = mp.tasks.BaseOptions.Delegate.GPU if use_gpu else mp.tasks.BaseOptions.Delegate.CPU
    logger.debug("BaseOptions: %s (delegate=%s)", model_path, delegate)
    return mp.tasks.BaseOptions(
        model_asset_path=str(model_path),
        delegate=delegate,
    )


def read_image(path: Path) -> np.ndarray:
    image = cv2.imread(str(path))
    if image is None:
        raise FileNotFoundError(f"Could not read image: {path}")
    return cv2.cvtColor(image, cv2.COLOR_BGR2RGB)


def save_image(image: np.ndarray, path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(path), cv2.cvtColor(image, cv2.COLOR_RGB2BGR))
    logger.info("Saved image: %s", path)
    return path
