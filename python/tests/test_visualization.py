from __future__ import annotations

from pathlib import Path

import numpy as np

from src.visualization import (
    draw_rectangle,
    draw_text,
    draw_landmarks,
    draw_fps,
    side_by_side,
    save_annotated_image,
)


class TestDrawRectangle:
    def test_returns_copy(self, blank_image: np.ndarray) -> None:
        result = draw_rectangle(blank_image, (10, 10, 50, 50))
        assert result is not blank_image

    def test_output_shape(self, blank_image: np.ndarray) -> None:
        result = draw_rectangle(blank_image, (10, 10, 50, 50))
        assert result.shape == blank_image.shape

    def test_different_colors(self, blank_image: np.ndarray) -> None:
        red = draw_rectangle(blank_image, (10, 10, 50, 50), (255, 0, 0))
        green = draw_rectangle(blank_image, (10, 10, 50, 50), (0, 255, 0))
        assert not np.array_equal(red, green)


class TestDrawText:
    def test_returns_copy(self, blank_image: np.ndarray) -> None:
        result = draw_text(blank_image, "test", (10, 30))
        assert result is not blank_image

    def test_output_shape(self, blank_image: np.ndarray) -> None:
        result = draw_text(blank_image, "test", (10, 30))
        assert result.shape == blank_image.shape


class TestDrawLandmarks:
    def test_returns_copy(self, blank_image: np.ndarray) -> None:
        landmarks = [(0.5, 0.5), (0.3, 0.7)]
        result = draw_landmarks(blank_image, landmarks)
        assert result is not blank_image

    def test_output_shape(self, blank_image: np.ndarray) -> None:
        landmarks = [(0.5, 0.5)]
        result = draw_landmarks(blank_image, landmarks)
        assert result.shape == blank_image.shape

    def test_empty_landmarks(self, blank_image: np.ndarray) -> None:
        result = draw_landmarks(blank_image, [])
        assert np.array_equal(result, blank_image)


class TestDrawFps:
    def test_returns_copy(self, blank_image: np.ndarray) -> None:
        result = draw_fps(blank_image, 30.0)
        assert result is not blank_image

    def test_output_shape(self, blank_image: np.ndarray) -> None:
        result = draw_fps(blank_image, 30.0)
        assert result.shape == blank_image.shape

    def test_zero_fps(self, blank_image: np.ndarray) -> None:
        result = draw_fps(blank_image, 0.0)
        assert result.shape == blank_image.shape


class TestSideBySide:
    def test_single_image(self, blank_image: np.ndarray) -> None:
        result = side_by_side([blank_image])
        assert result.shape == blank_image.shape

    def test_two_images(self, blank_image: np.ndarray) -> None:
        result = side_by_side([blank_image, blank_image])
        assert result.shape[0] == blank_image.shape[0]
        assert result.shape[2] == blank_image.shape[2]

    def test_different_height_images(self) -> None:
        small = np.zeros((100, 200, 3), dtype=np.uint8)
        large = np.zeros((200, 200, 3), dtype=np.uint8)
        result = side_by_side([small, large])
        assert result.shape[0] == min(100, 200)


class TestSaveAnnotatedImage:
    def test_saves_file(self, blank_image: np.ndarray, tmp_path: Path) -> None:
        result = save_annotated_image(blank_image, "test.jpg", tmp_path)
        assert result.exists()
        assert result.suffix == ".jpg"
