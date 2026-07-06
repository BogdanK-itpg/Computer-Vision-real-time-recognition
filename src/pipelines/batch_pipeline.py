from __future__ import annotations

import logging
from pathlib import Path

import cv2
import numpy as np

from src.camera import ImageFileSource, VideoFileSource
from src.config import Config
from src.detectors.face_detector import FaceDetector
from src.detectors.object_detector import ObjectDetector
from src.pipelines.base_pipeline import BasePipeline
from src.pipelines.video_pipeline import VideoPipeline
from src.visualization import draw_rectangle, draw_text

logger = logging.getLogger(__name__)


class BatchPipeline(BasePipeline):
    def __init__(self, config: Config) -> None:
        super().__init__(config)
        self._input_dir = config.images_dir
        self._video_dir = config.videos_dir

    def run(self) -> None:
        logger.info("Batch pipeline started")

        image_extensions = {".jpg", ".jpeg", ".png", ".bmp", ".tiff"}
        video_extensions = {".mp4", ".avi", ".mov", ".mkv"}

        images = sorted(
            p for p in self._input_dir.iterdir()
            if p.suffix.lower() in image_extensions
        )
        videos = sorted(
            p for p in self._video_dir.iterdir()
            if p.suffix.lower() in video_extensions
        )

        logger.info("Found %d images, %d videos", len(images), len(videos))

        for i, img_path in enumerate(images):
            logger.info("[%d/%d] Processing image: %s", i + 1, len(images), img_path.name)
            try:
                self._process_single_image(img_path)
            except Exception as e:
                logger.error("Failed to process image %s: %s", img_path.name, e)

        for i, vid_path in enumerate(videos):
            logger.info("[%d/%d] Processing video: %s", i + 1, len(videos), vid_path.name)
            try:
                video_config = Config(
                    video_path=vid_path,
                    output_dir=self._config.output_dir,
                )
                vp = VideoPipeline(video_config)
                vp.run()
            except Exception as e:
                logger.error("Failed to process video %s: %s", vid_path.name, e)

        logger.info("Batch pipeline finished")

    def _process_single_image(self, path: Path) -> None:
        with ImageFileSource(path) as source:
            image = source.read()
            if image is None:
                return

            annotated = image.copy()

            try:
                fd = FaceDetector(self._config)
                fd.initialize()
                detections = fd.detect(image)
                for det in detections:
                    x, y, w, h = det.bounding_box
                    annotated = draw_rectangle(annotated, (x, y, w, h), (0, 255, 0))
                    annotated = draw_text(
                        annotated, f"Face: {det.score:.2f}",
                        (x, max(y - 5, 0)), (0, 255, 0),
                    )
                fd.close()
            except Exception as e:
                logger.warning("Face detector: %s", e)

            try:
                od = ObjectDetector(self._config)
                od.initialize()
                objs = od.detect(image)
                for obj in objs:
                    x, y, w, h = obj.bounding_box
                    annotated = draw_rectangle(annotated, (x, y, w, h), (0, 0, 255))
                    annotated = draw_text(
                        annotated, f"{obj.category_name}: {obj.score:.2f}",
                        (x, max(y - 5, 0)), (0, 0, 255),
                    )
                od.close()
            except Exception as e:
                logger.warning("Object detector: %s", e)

            output_name = f"batch_{path.stem}.jpg"
            self._save_output(annotated, output_name)
