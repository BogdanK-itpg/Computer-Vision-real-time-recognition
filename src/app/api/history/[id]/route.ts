import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { del } = await import("@vercel/blob");
    await del(`history/${id}.json`);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete history entry";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
