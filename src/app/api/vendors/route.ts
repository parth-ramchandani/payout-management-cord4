import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { VendorModel } from "@/models/Vendor";
import { requireAuth } from "@/lib/auth";

const createVendorSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
  upi_id: z.string().optional(),
  bank_account: z.string().optional(),
  ifsc: z.string().optional(),
  is_active: z.boolean().optional(),
});

export async function GET() {
  try {
    await getDb();
    await requireAuth();

    const vendors = await VendorModel.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ vendors });
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

    console.error("GET /vendors error", err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    await getDb();
    await requireAuth();

    const json = await request.json();
    const data = createVendorSchema.parse(json);

    const vendor = await VendorModel.create(data);
    return NextResponse.json(
      { vendor: { ...vendor.toObject(), id: vendor._id.toString() } },
      { status: 201 }
    );
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          message: "Please check the provided data and try again",
          details: err.flatten().fieldErrors,
        },
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

    console.error("POST /vendors error", err);
    return NextResponse.json({ error: message }, { status });
  }
}

