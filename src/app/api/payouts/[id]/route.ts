import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PayoutModel } from "@/models/Payout";
import { PayoutAuditModel } from "@/models/PayoutAudit";
import { USER_ROLES } from "@/models/User";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_request: Request, context: Params) {
  try {
    const { id } = await context.params;
    await getDb();
    await requireRole(USER_ROLES);

    const payout = await PayoutModel.findById(id)
      .populate("vendor_id")
      .lean();

    if (!payout) {
      return NextResponse.json(
        { error: "Payout not found", message: `No payout found with ID: ${id}` },
        { status: 404 }
      );
    }

    const audits = await PayoutAuditModel.find({ payout_id: id })
      .populate("performed_by", "email role")
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({ payout, audits });
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

    console.error("GET /payouts/:id error", err);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

