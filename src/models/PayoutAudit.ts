import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const AUDIT_ACTIONS = [
  "CREATED",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

const PayoutAuditSchema = new Schema(
  {
    payout_id: {
      type: Schema.Types.ObjectId,
      ref: "Payout",
      required: true,
    },
    action: {
      type: String,
      enum: AUDIT_ACTIONS,
      required: true,
    },
    performed_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

PayoutAuditSchema.index({ payout_id: 1, createdAt: 1 });

export type PayoutAudit = InferSchemaType<typeof PayoutAuditSchema>;

export const PayoutAuditModel =
  (mongoose.models.PayoutAudit as mongoose.Model<PayoutAudit>) ||
  mongoose.model<PayoutAudit>("PayoutAudit", PayoutAuditSchema);

