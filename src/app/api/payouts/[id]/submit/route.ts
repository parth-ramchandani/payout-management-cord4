import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PayoutModel } from "@/models/Payout";
import { PayoutAuditModel } from "@/models/PayoutAudit";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(_request: Request, context: Params) {
  try {
    const { id } = await context.params;
    await getDb();
    const user = await requireRole(["OPS"]);

    const payout = await PayoutModel.findById(id);
    if (!payout) {
      return NextResponse.json({ error: "Payout not found" }, { status: 404 });
    }

    if (payout.status !== "Draft") {
      return NextResponse.json(
        {
          error: "Invalid status transition",
          message: `Only Draft payouts can be submitted. Current status: ${payout.status}`,
        },
        { status: 400 }
      );
    }

    payout.status = "Submitted";
    await payout.save();

    await PayoutAuditModel.create({
      payout_id: payout._id,
      action: "SUBMITTED",
      performed_by: user.id,
    });

    return NextResponse.json({ payout });
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

    console.error("POST /payouts/:id/submit error", err);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

