import { NextRequest, NextResponse } from "next/server";
import { list, put } from "@vercel/blob";

const HISTORY_PREFIX = "history/";

export async function GET() {
  try {
    const { blobs } = await list({ prefix: HISTORY_PREFIX });
    const entries = await Promise.all(
      blobs
        .sort(
          (a, b) =>
            new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
        )
        .map(async (blob) => {
          try {
            const res = await fetch(blob.url);
            const data = await res.json();
            return data;
          } catch {
            return null;
          }
        }),
    );

    return NextResponse.json({
      entries: entries.filter(Boolean),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list history";
    return NextResponse.json({ entries: [], error: message });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, thumbnailUrl, detectors, results, processingTimeMs } =
      body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "imageUrl is required" },
        { status: 400 },
      );
    }

    const entry = {
      id: crypto.randomUUID(),
      imageUrl,
      thumbnailUrl: thumbnailUrl ?? null,
      detectors: detectors ?? [],
      results: results ?? null,
      processingTimeMs: processingTimeMs ?? 0,
      createdAt: new Date().toISOString(),
    };

    await put(`${HISTORY_PREFIX}${entry.id}.json`, JSON.stringify(entry), {
      access: "public",
      contentType: "application/json",
    });

    return NextResponse.json({ entry });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save history";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
