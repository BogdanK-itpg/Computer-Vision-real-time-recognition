from __future__ import annotations

from pathlib import Path

import pytest

from src.config import Config
from src.pipelines.image_pipeline import ImagePipeline
from src.pipelines.video_pipeline import VideoPipeline


class TestImagePipeline:
    def test_requires_image_path(self) -> None:
        config = Config()
        with pytest.raises(ValueError, match="image_path must be set"):
            ImagePipeline(config)

    def test_run_creates_output(self, test_image_path: Path, tmp_path: Path) -> None:
        config = Config(
            image_path=test_image_path,
            output_dir=tmp_path,
        )
        pipeline = ImagePipeline(config)
        pipeline.run()
        pipeline.close()
        outputs = list(tmp_path.glob("annotated_*"))
        assert len(outputs) > 0

    def test_run_with_blank_image(self, tmp_path: Path) -> None:
        import cv2
        import numpy as np
        img_path = tmp_path / "blank.jpg"
        cv2.imwrite(str(img_path), np.ones((100, 100, 3), dtype=np.uint8) * 200)

        config = Config(image_path=img_path, output_dir=tmp_path)
        pipeline = ImagePipeline(config)
        pipeline.run()
        pipeline.close()


class TestVideoPipeline:
    def test_requires_video_path(self) -> None:
        config = Config()
        with pytest.raises(ValueError, match="video_path must be set"):
            VideoPipeline(config)

    def test_run_creates_output(self, test_video_path: Path, tmp_path: Path) -> None:
        config = Config(
            video_path=test_video_path,
            output_dir=tmp_path,
        )
        pipeline = VideoPipeline(config)
        pipeline.run()
        pipeline.close()
        outputs = list(tmp_path.glob("processed_*"))
        assert len(outputs) > 0
