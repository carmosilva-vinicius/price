import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequestResponse } from "@/app/api/errors";
import { createAsset, listAssetRows } from "@/lib/services/assets";

const createAssetSchema = z.object({
  ticker: z.string().trim().min(1).max(12)
});

export async function GET() {
  return NextResponse.json({ assets: listAssetRows() });
}

export async function POST(request: Request) {
  try {
    const body = createAssetSchema.parse(await request.json());
    createAsset(body.ticker);
    return NextResponse.json({ assets: listAssetRows() }, { status: 201 });
  } catch (error) {
    return badRequestResponse(error);
  }
}
