import { describe, it, expect } from "vitest";
import { AppConfigSchema, MODEL_REGISTRY, DEFAULT_CONFIG, DetectorConfigSchema } from "@/lib/config";

describe("AppConfigSchema", () => {
  it("parses empty config with defaults", () => {
    const config = AppConfigSchema.parse({});
    expect(config.camera.preferredWidth).toBe(640);
    expect(config.camera.preferredHeight).toBe(480);
    expect(config.camera.preferredFps).toBe(30);
    expect(config.upload.maxImageSizeMB).toBe(20);
    expect(config.upload.maxVideoSizeMB).toBe(100);
    expect(config.ui.defaultTheme).toBe("system");
    expect(config.ui.frameSkip).toBe(1);
  });

  it("allows overriding values", () => {
    const config = AppConfigSchema.parse({
      camera: { preferredWidth: 1280, preferredHeight: 720 },
      ui: { defaultTheme: "dark" },
    });
    expect(config.camera.preferredWidth).toBe(1280);
    expect(config.camera.preferredHeight).toBe(720);
    expect(config.ui.defaultTheme).toBe("dark");
    expect(config.camera.preferredFps).toBe(30);
  });

  it("rejects invalid detector config", () => {
    expect(() => DetectorConfigSchema.parse({ confidence: -1 })).toThrow();
    expect(() => DetectorConfigSchema.parse({ confidence: 2 })).toThrow();
    expect(() => DetectorConfigSchema.parse({ maxResults: 0 })).toThrow();
  });

  it("accepts valid detector config", () => {
    const config = DetectorConfigSchema.parse({ confidence: 0.8, maxResults: 10 });
    expect(config.confidence).toBe(0.8);
    expect(config.maxResults).toBe(10);
    expect(config.enabled).toBe(true);
  });
});

describe("DEFAULT_CONFIG", () => {
  it("is valid", () => {
    expect(() => AppConfigSchema.parse(DEFAULT_CONFIG)).not.toThrow();
  });
});

describe("MODEL_REGISTRY", () => {
  it("has all 7 detectors", () => {
    const expected = [
      "face_detector", "face_landmarker", "hand_landmarker",
      "pose_landmarker", "object_detector", "image_segmenter",
      "gesture_recognizer",
    ];
    expect(Object.keys(MODEL_REGISTRY)).toEqual(expected);
  });

  it("every entry has url, version, sizeBytes, and detectorType", () => {
    for (const [key, entry] of Object.entries(MODEL_REGISTRY)) {
      expect(entry.url).toBeTruthy();
      expect(entry.url.startsWith("https://")).toBe(true);
      expect(entry.version).toBeTruthy();
      expect(entry.sizeBytes).toBeGreaterThan(0);
      expect(entry.detectorType).toBe(key);
    }
  });
});
