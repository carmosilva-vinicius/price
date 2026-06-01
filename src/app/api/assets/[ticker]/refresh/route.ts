import { NextResponse } from "next/server";
import { refreshAsset } from "@/lib/services/assets";

export async function POST(
  _request: Request,
  context: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await context.params;

  try {
    const asset = await refreshAsset(ticker);
    return NextResponse.json({ asset });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected refresh error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
