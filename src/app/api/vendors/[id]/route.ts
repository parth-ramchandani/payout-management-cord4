import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { VendorModel } from "@/models/Vendor";
import { requireAuth } from "@/lib/auth";

const updateVendorSchema = z.object({
  name: z.string().min(1),
  upi_id: z.string().min(1).optional().nullable(),
  bank_account: z.string().min(1).optional().nullable(),
  ifsc: z.string().min(1).optional().nullable(),
  is_active: z.boolean(),
});

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_request: Request, context: Params) {
  try {
    const { id } = await context.params;
    await getDb();
    await requireAuth();

    const vendor = await VendorModel.findById(id).lean();
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    return NextResponse.json({ vendor });
  } catch (err: unknown) {
    const status =
      typeof err === "object" && err && "statusCode" in err
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ((err as any).statusCode as number)
        : 500;

    const message =
      status === 401
        ? "Unauthorized"
        : status === 403
        ? "Forbidden"
        : "Internal server error";

    console.error("GET /vendors/:id error", err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: Request, context: Params) {
  try {
    const { id } = await context.params;
    await getDb();
    await requireAuth();

    const json = await request.json();
    const data = updateVendorSchema.parse(json);

    const vendor = await VendorModel.findByIdAndUpdate(
      id,
      {
        name: data.name,
        upi_id: data.upi_id || undefined,
        bank_account: data.bank_account || undefined,
        ifsc: data.ifsc || undefined,
        is_active: data.is_active,
      },
      { new: true }
    ).lean();

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    return NextResponse.json({ vendor });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.flatten() },
        { status: 400 }
      );
    }

    const status =
      typeof err === "object" && err && "statusCode" in err
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ((err as any).statusCode as number)
        : 500;

    const message =
      status === 401
        ? "Unauthorized"
        : status === 403
        ? "Forbidden"
        : "Internal server error";

    console.error("PUT /vendors/:id error", err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, context: Params) {
  try {
    const { id } = await context.params;
    await getDb();
    await requireAuth();

    const result = await VendorModel.findByIdAndDelete(id).lean();
    if (!result) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const status =
      typeof err === "object" && err && "statusCode" in err
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ((err as any).statusCode as number)
        : 500;

    const message =
      status === 401
        ? "Unauthorized"
        : status === 403
        ? "Forbidden"
        : "Internal server error";

    console.error("DELETE /vendors/:id error", err);
    return NextResponse.json({ error: message }, { status });
  }
}

