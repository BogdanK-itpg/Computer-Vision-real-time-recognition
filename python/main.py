from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

from src.config import Config
from src.pipelines.batch_pipeline import BatchPipeline
from src.pipelines.image_pipeline import ImagePipeline
from src.pipelines.video_pipeline import VideoPipeline
from src.pipelines.webcam_pipeline import WebcamPipeline
from src.utils import setup_logging

logger = logging.getLogger(__name__)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Computer Vision Application — MediaPipe Tasks API",
    )
    parser.add_argument(
        "--image", "-i",
        type=Path,
        help="Path to input image file",
    )
    parser.add_argument(
        "--video", "-v",
        type=Path,
        help="Path to input video file",
    )
    parser.add_argument(
        "--camera",
        type=int,
        default=0,
        help="Camera index (default: 0)",
    )
    parser.add_argument(
        "--batch",
        action="store_true",
        help="Batch process all images in assets/images/ and videos in assets/videos/",
    )
    parser.add_argument(
        "--frame-skip",
        type=int,
        default=0,
        help="Process every Nth frame (0 = process all)",
    )
    parser.add_argument(
        "--gpu",
        action="store_true",
        help="Use GPU delegate if available",
    )
    parser.add_argument(
        "--confidence",
        type=float,
        default=0.5,
        help="Detection confidence threshold (default: 0.5)",
    )
    parser.add_argument(
        "--max-results",
        type=int,
        default=5,
        help="Maximum number of results per detector (default: 5)",
    )
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    config = Config(
        camera_index=args.camera,
        image_path=args.image,
        video_path=args.video,
        frame_skip=args.frame_skip,
        use_gpu=args.gpu,
        face_detection_confidence=args.confidence,
        face_landmarker_confidence=args.confidence,
        hand_landmarker_confidence=args.confidence,
        pose_landmarker_confidence=args.confidence,
        object_detection_confidence=args.confidence,
        gesture_confidence=args.confidence,
        max_results=args.max_results,
    )

    setup_logging(config)
    logger.info("Computer Vision Application started")

    try:
        if args.batch:
            pipeline = BatchPipeline(config)
        elif args.video:
            pipeline = VideoPipeline(config)
        elif args.image:
            pipeline = ImagePipeline(config)
        else:
            pipeline = WebcamPipeline(config)

        pipeline.run()
        pipeline.close()

    except KeyboardInterrupt:
        logger.info("Interrupted by user")
    except Exception as e:
        logger.exception("Pipeline failed: %s", e)
        sys.exit(1)

    logger.info("Application finished")


if __name__ == "__main__":
    main()
