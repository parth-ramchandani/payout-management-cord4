import mongoose, { Schema, type InferSchemaType } from "mongoose";

const VendorSchema = new Schema(
  {
    name: { type: String, required: true },
    upi_id: { type: String },
    bank_account: { type: String },
    ifsc: { type: String },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type Vendor = InferSchemaType<typeof VendorSchema>;

export const VendorModel =
  (mongoose.models.Vendor as mongoose.Model<Vendor>) ||
  mongoose.model<Vendor>("Vendor", VendorSchema);

