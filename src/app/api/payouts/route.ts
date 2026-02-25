import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { VendorModel } from "@/models/Vendor";
import { PayoutModel, PAYOUT_MODES, PAYOUT_STATUSES } from "@/models/Payout";
import { PayoutAuditModel } from "@/models/PayoutAudit";
import { USER_ROLES } from "@/models/User";

const createPayoutSchema = z.object({
  vendor_id: z.string().min(1),
  amount: z.number().positive(),
  mode: z.enum(PAYOUT_MODES),
  note: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await getDb();
    await requireRole(USER_ROLES);

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const vendorId = searchParams.get("vendor_id");

    const filter: Record<string, unknown> = {};
    if (status && PAYOUT_STATUSES.includes(status as (typeof PAYOUT_STATUSES)[number])) {
      filter.status = status;
    }
    if (vendorId) {
      filter.vendor_id = vendorId;
    }

    const payouts = await PayoutModel.find(filter)
      .populate("vendor_id")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ payouts });
  } catch (err: unknown) {
    const statusCode =
      typeof err === "object" && err && "statusCode" in err
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ((err as any).statusCode as number)
        : 500;

    const message =
      statusCode === 401
        ? "Unauthorized"
        : statusCode === 403
        ? "Forbidden"
        : "Internal server error";

    console.error("GET /payouts error", err);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

export async function POST(request: Request) {
  try {
    await getDb();
    const user = await requireRole(["OPS"]);

    const json = await request.json();
    const parsed = createPayoutSchema.parse(json);

    const vendor = await VendorModel.findById(parsed.vendor_id).lean();
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const payout = await PayoutModel.create({
      vendor_id: parsed.vendor_id,
      amount: parsed.amount,
      mode: parsed.mode,
      note: parsed.note,
      status: "Draft",
    });

    await PayoutAuditModel.create({
      payout_id: payout._id,
      action: "CREATED",
      performed_by: user.id,
    });

    return NextResponse.json(
      { payout: { ...payout.toObject(), id: payout._id.toString() } },
      { status: 201 }
    );
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.flatten() },
        { status: 400 }
      );
    }

    const statusCode =
      typeof err === "object" && err && "statusCode" in err
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ((err as any).statusCode as number)
        : 500;

    const message =
      statusCode === 401
        ? "Unauthorized"
        : statusCode === 403
        ? "Forbidden"
        : "Internal server error";

    console.error("POST /payouts error", err);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

