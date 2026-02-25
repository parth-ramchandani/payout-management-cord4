import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PayoutModel } from "@/models/Payout";
import { PayoutAuditModel } from "@/models/PayoutAudit";

const rejectSchema = z.object({
  reason: z.string().min(1, "Rejection reason is required"),
});

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: Request, context: Params) {
  try {
    const { id } = await context.params;
    await getDb();
    const user = await requireRole(["FINANCE"]);

    const json = await request.json();
    const { reason } = rejectSchema.parse(json);

    const payout = await PayoutModel.findById(id);
    if (!payout) {
      return NextResponse.json(
        { error: "Payout not found", message: `No payout found with ID: ${id}` },
        { status: 404 }
      );
    }

    if (payout.status !== "Submitted") {
      return NextResponse.json(
        {
          error: "Invalid status transition",
          message: `Only Submitted payouts can be rejected. Current status: ${payout.status}`,
        },
        { status: 400 }
      );
    }

    payout.status = "Rejected";
    payout.decision_reason = reason;
    await payout.save();

    await PayoutAuditModel.create({
      payout_id: payout._id,
      action: "REJECTED",
      performed_by: user.id,
    });

    return NextResponse.json({ payout });
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

    console.error("POST /payouts/:id/reject error", err);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

