import { NextResponse } from "next/server";
import { MODEL_REGISTRY } from "@/lib/config";

export async function GET() {
  return NextResponse.json({
    models: Object.entries(MODEL_REGISTRY).map(([key, entry]) => ({
      id: key,
      url: entry.url,
      version: entry.version,
      sizeBytes: entry.sizeBytes,
    })),
  });
}
