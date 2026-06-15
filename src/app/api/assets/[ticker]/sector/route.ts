import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequestResponse } from "@/app/api/errors";
import { listAssetRows, updateAssetSector } from "@/lib/services/assets";

const schema = z.object({
  sector: z.string().trim().nullable()
});

export async function PUT(
  request: Request,
  context: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await context.params;

  try {
    const body = schema.parse(await request.json());
    const sectorValue = body.sector === "" ? null : body.sector;
    updateAssetSector(ticker, sectorValue);
    return NextResponse.json({ assets: listAssetRows() });
  } catch (error) {
    return badRequestResponse(error);
  }
}
