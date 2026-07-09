import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

const DETECTORS = [
  {
    name: "Face Detection",
    desc: "Detect faces with bounding boxes and keypoints (6 landmarks per face).",
  },
  {
    name: "Face Landmarker",
    desc: "478 face landmarks per face with blend shape coefficients.",
  },
  {
    name: "Hand Landmarker",
    desc: "21 hand landmarks per hand with left/right classification. Up to 5 hands.",
  },
  {
    name: "Pose Landmarker",
    desc: "33 full-body pose landmarks. Supports multiple poses.",
  },
  {
    name: "Object Detector",
    desc: "Detect common objects with bounding boxes and labels.",
  },
  {
    name: "Image Segmenter",
    desc: "Pixel-level segmentation masks for foreground/background separation.",
  },
  {
    name: "Gesture Recognizer",
    desc: "Recognize hand gestures combined with hand landmark detection.",
  },
];

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <section className="mb-12">
        <h1 className="text-3xl font-bold text-gray-900">About CV Detect</h1>
        <p className="mt-4 text-lg text-gray-600 leading-relaxed">
          CV Detect is a browser-based computer vision application that runs
          entirely on the client side. All detection models are loaded from a
          CDN and executed using WebGL/WebGPU via Google&rsquo;s MediaPipe Tasks
          API. No images are ever uploaded to a server.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Detectors</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {DETECTORS.map((d) => (
            <Card key={d.name}>
              <CardHeader>
                <CardTitle>{d.name}</CardTitle>
                <CardDescription>{d.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Technology</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { name: "Next.js", desc: "React framework with App Router" },
            {
              name: "MediaPipe",
              desc: "On-device ML inference via WebGL/WebGPU",
            },
            { name: "Tailwind CSS", desc: "Utility-first styling" },
          ].map((t) => (
            <Card key={t.name}>
              <CardHeader>
                <CardTitle>{t.name}</CardTitle>
                <CardDescription>{t.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
