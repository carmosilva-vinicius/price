import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function badRequestResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Invalid request body", issues: error.issues },
      { status: 400 }
    );
  }

  if (error instanceof SyntaxError) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  throw error;
}
