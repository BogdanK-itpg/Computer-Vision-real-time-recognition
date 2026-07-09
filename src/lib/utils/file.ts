const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const ALLOWED_VIDEO_TYPES = ["video/mp4"] as const;
const MAX_IMAGE_SIZE = 20 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageFile(file: File): FileValidationResult {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number])) {
    return {
      valid: false,
      error: `Unsupported image type: ${file.type}. Accepted: ${ALLOWED_IMAGE_TYPES.join(", ")}`,
    };
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      error: `Image too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum: 20MB`,
    };
  }
  return { valid: true };
}

export function validateVideoFile(file: File): FileValidationResult {
  if (!ALLOWED_VIDEO_TYPES.includes(file.type as typeof ALLOWED_VIDEO_TYPES[number])) {
    return {
      valid: false,
      error: `Unsupported video type: ${file.type}. Accepted: ${ALLOWED_VIDEO_TYPES.join(", ")}`,
    };
  }
  if (file.size > MAX_VIDEO_SIZE) {
    return {
      valid: false,
      error: `Video too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum: 100MB`,
    };
  }
  return { valid: true };
}

export function readFileAsImageData(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function getFileExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex === -1) return "";
  return filename.slice(dotIndex + 1).toLowerCase();
}
