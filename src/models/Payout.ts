import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const PAYOUT_MODES = ["UPI", "IMPS", "NEFT"] as const;
export type PayoutMode = (typeof PAYOUT_MODES)[number];

export const PAYOUT_STATUSES = [
  "Draft",
  "Submitted",
  "Approved",
  "Rejected",
] as const;
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];

const PayoutSchema = new Schema(
  {
    vendor_id: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    mode: {
      type: String,
      enum: PAYOUT_MODES,
      required: true,
    },
    note: {
      type: String,
    },
    status: {
      type: String,
      enum: PAYOUT_STATUSES,
      default: "Draft",
      required: true,
    },
    decision_reason: {
      type: String,
    },
  },
  { timestamps: true }
);

export type Payout = InferSchemaType<typeof PayoutSchema>;

export const PayoutModel =
  (mongoose.models.Payout as mongoose.Model<Payout>) ||
  mongoose.model<Payout>("Payout", PayoutSchema);

