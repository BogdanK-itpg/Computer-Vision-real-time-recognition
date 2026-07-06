from __future__ import annotations

from pathlib import Path
from typing import Optional, Sequence

import cv2
import numpy as np

from src.utils import save_image


def draw_rectangle(
    image: np.ndarray,
    bbox: tuple[int, int, int, int],
    color: tuple[int, int, int] = (0, 255, 0),
    thickness: int = 2,
) -> np.ndarray:
    x, y, w, h = bbox
    return cv2.rectangle(image.copy(), (x, y), (x + w, y + h), color, thickness)


def draw_text(
    image: np.ndarray,
    text: str,
    position: tuple[int, int],
    color: tuple[int, int, int] = (0, 255, 0),
    font_scale: float = 0.6,
    thickness: int = 2,
) -> np.ndarray:
    return cv2.putText(
        image.copy(), text, position,
        cv2.FONT_HERSHEY_SIMPLEX, font_scale, color, thickness,
    )


def draw_landmarks(
    image: np.ndarray,
    landmarks: Sequence[tuple[float, float]],
    color: tuple[int, int, int] = (0, 255, 0),
    radius: int = 2,
) -> np.ndarray:
    canvas = image.copy()
    h, w = canvas.shape[:2]
    for x, y in landmarks:
        cx, cy = int(x * w), int(y * h)
        cv2.circle(canvas, (cx, cy), radius, color, -1)
    return canvas


def draw_fps(
    image: np.ndarray,
    fps: float,
    color: tuple[int, int, int] = (0, 255, 0),
) -> np.ndarray:
    return draw_text(image, f"FPS: {fps:.1f}", (10, 30), color)


def side_by_side(
    images: Sequence[np.ndarray],
    titles: Optional[Sequence[str]] = None,
) -> np.ndarray:
    if len(images) < 2:
        return images[0]
    min_h = min(img.shape[0] for img in images)
    resized = []
    for img in images:
        aspect = img.shape[1] / img.shape[0]
        new_w = int(min_h * aspect)
        resized.append(cv2.resize(img, (new_w, min_h)))
    return np.concatenate(resized, axis=1)


def display_image(image: np.ndarray, window_name: str = "Output", wait_key: int = 0) -> None:
    cv2.imshow(window_name, cv2.cvtColor(image, cv2.COLOR_RGB2BGR))
    cv2.waitKey(wait_key)


def save_annotated_image(
    image: np.ndarray,
    filename: str,
    output_dir: Path,
) -> Path:
    return save_image(image, output_dir / filename)
