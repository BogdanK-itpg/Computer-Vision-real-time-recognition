import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import sharp from "sharp";

async function stripExif(buffer: Buffer, mimeType: string): Promise<Buffer> {
  if (mimeType === "video/mp4") return buffer;
  try {
    return await sharp(buffer).withMetadata({ exif: undefined, icc: undefined }).toBuffer();
  } catch {
    return buffer;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "video/mp4"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}` },
        { status: 400 },
      );
    }

    const maxSize = file.type.startsWith("video/") ? 100 * 1024 * 1024 : 20 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File exceeds size limit" },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const cleaned = await stripExif(Buffer.from(arrayBuffer), file.type);

    const blob = await put(`uploads/${Date.now()}-${file.name}`, cleaned, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
    });

    return NextResponse.json({
      url: blob.url,
      contentType: blob.contentType,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
