import { describe, it, expect } from "vitest";
import {
  validateImageFile,
  validateVideoFile,
  formatFileSize,
  getFileExtension,
} from "@/lib/utils/file";

describe("validateImageFile", () => {
  it("accepts valid JPEG", () => {
    const file = new File(["fake"], "test.jpg", { type: "image/jpeg" });
    Object.defineProperty(file, "size", { value: 1024 * 1024 });
    expect(validateImageFile(file).valid).toBe(true);
  });

  it("accepts valid PNG", () => {
    const file = new File(["fake"], "test.png", { type: "image/png" });
    Object.defineProperty(file, "size", { value: 1024 * 1024 });
    expect(validateImageFile(file).valid).toBe(true);
  });

  it("rejects unsupported type", () => {
    const file = new File(["fake"], "test.gif", { type: "image/gif" });
    Object.defineProperty(file, "size", { value: 1024 });
    expect(validateImageFile(file).valid).toBe(false);
    expect(validateImageFile(file).error).toContain("Unsupported");
  });

  it("rejects oversized file", () => {
    const file = new File(["fake"], "test.jpg", { type: "image/jpeg" });
    Object.defineProperty(file, "size", { value: 30 * 1024 * 1024 });
    expect(validateImageFile(file).valid).toBe(false);
    expect(validateImageFile(file).error).toContain("too large");
  });
});

describe("validateVideoFile", () => {
  it("accepts valid MP4", () => {
    const file = new File(["fake"], "test.mp4", { type: "video/mp4" });
    Object.defineProperty(file, "size", { value: 1024 * 1024 });
    expect(validateVideoFile(file).valid).toBe(true);
  });

  it("rejects unsupported video type", () => {
    const file = new File(["fake"], "test.avi", { type: "video/x-msvideo" });
    Object.defineProperty(file, "size", { value: 1024 });
    expect(validateVideoFile(file).valid).toBe(false);
  });

  it("rejects oversized video", () => {
    const file = new File(["fake"], "test.mp4", { type: "video/mp4" });
    Object.defineProperty(file, "size", { value: 200 * 1024 * 1024 });
    expect(validateVideoFile(file).valid).toBe(false);
  });
});

describe("formatFileSize", () => {
  it("formats bytes", () => expect(formatFileSize(500)).toBe("500B"));
  it("formats KB", () => expect(formatFileSize(2048)).toBe("2.0KB"));
  it("formats MB", () => expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0MB"));
});

describe("getFileExtension", () => {
  it("returns lowercase extension", () => expect(getFileExtension("test.JPG")).toBe("jpg"));
  it("returns empty for no extension", () => expect(getFileExtension("test")).toBe(""));
  it("handles multiple dots", () => expect(getFileExtension("image.min.jpg")).toBe("jpg"));
});
