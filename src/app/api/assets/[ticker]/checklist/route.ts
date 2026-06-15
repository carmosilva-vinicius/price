import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequestResponse } from "@/app/api/errors";
import {
  getAssetChecklist,
  listAssetRows,
  updateAssetChecklist
} from "@/lib/services/assets";

const putSchema = z.object({
  checklist: z.array(
    z.object({
      criterionId: z.string().min(1),
      status: z.enum(["yes", "no", "unsure"])
    })
  )
});

export async function GET(
  request: Request,
  context: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await context.params;
  try {
    const checklist = getAssetChecklist(ticker);
    return NextResponse.json({ checklist });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await context.params;

  try {
    const body = putSchema.parse(await request.json());
    updateAssetChecklist(ticker, body.checklist);
    return NextResponse.json({ success: true, assets: listAssetRows() });
  } catch (error) {
    return badRequestResponse(error);
  }
}
