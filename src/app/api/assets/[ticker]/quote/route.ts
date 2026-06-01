import { NextResponse } from "next/server";
import { z } from "zod";
import { listAssetRows, updateManualQuote } from "@/lib/services/assets";

const schema = z.object({
  price: z.number().positive()
});

export async function PUT(
  request: Request,
  context: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await context.params;
  const body = schema.parse(await request.json());
  updateManualQuote({ ticker, price: body.price });
  return NextResponse.json({ assets: listAssetRows() });
}
