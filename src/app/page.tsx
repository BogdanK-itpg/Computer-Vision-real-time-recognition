import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const MODES = [
  {
    title: "Image Detection",
    description:
      "Upload an image and run any combination of detectors. View annotated results with bounding boxes, landmarks, and segmentation masks.",
    href: "/detection/image",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
        />
      </svg>
    ),
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    title: "Webcam Detection",
    description:
      "Real-time face, hand, pose, and object detection using your camera. Toggle detectors on the fly and see results live.",
    href: "/detection/webcam",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
    ),
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    title: "Video Detection",
    description:
      "Process a video file frame by frame. Extract detections at every frame with configurable frame skipping.",
    href: "/detection/video",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
        />
      </svg>
    ),
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
];

const DETECTORS = [
  { label: "Face Detection", color: "bg-green-100 text-green-700" },
  { label: "Face Landmarks", color: "bg-blue-100 text-blue-700" },
  { label: "Hand Landmarks", color: "bg-yellow-100 text-yellow-700" },
  { label: "Pose Landmarks", color: "bg-purple-100 text-purple-700" },
  { label: "Object Detection", color: "bg-red-100 text-red-700" },
  { label: "Segmentation", color: "bg-cyan-100 text-cyan-700" },
  { label: "Gesture Recognition", color: "bg-pink-100 text-pink-700" },
];

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Computer Vision in Your Browser
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Run real-time face, hand, pose, object detection, segmentation, and
          gesture recognition directly in the browser. No server required —
          powered by MediaPipe and WebGL.
        </p>
      </section>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-16">
        {MODES.map((mode) => (
          <Link key={mode.href} href={mode.href} className="group">
            <Card
              padding="lg"
              className="h-full transition-shadow hover:shadow-md"
            >
              <CardHeader>
                <div
                  className={`w-12 h-12 rounded-xl ${mode.bgColor} flex items-center justify-center ${mode.color}`}
                >
                  {mode.icon}
                </div>
                <CardTitle className="mt-4 group-hover:text-blue-600 transition-colors">
                  {mode.title}
                </CardTitle>
                <CardDescription>{mode.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
          Available Detectors
        </h2>
        <div className="flex flex-wrap justify-center gap-2">
          {DETECTORS.map((d) => (
            <Badge key={d.label} className={`${d.color} px-3 py-1`}>
              {d.label}
            </Badge>
          ))}
        </div>
      </section>
    </div>
  );
}
