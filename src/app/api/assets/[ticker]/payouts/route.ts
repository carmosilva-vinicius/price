import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequestResponse } from "@/app/api/errors";
import { listAssetRows, updateManualPayout } from "@/lib/services/assets";

const schema = z.object({
  year: z.number().int().min(1900).max(2200),
  amount: z.number().nonnegative()
});

export async function PUT(
  request: Request,
  context: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await context.params;

  try {
    const body = schema.parse(await request.json());
    updateManualPayout({ ticker, year: body.year, amount: body.amount });
    return NextResponse.json({ assets: listAssetRows() });
  } catch (error) {
    return badRequestResponse(error);
  }
}
