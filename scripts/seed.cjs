/* eslint-disable @typescript-eslint/no-var-requires */
require("dotenv").config(); 
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME ?? 'payout_mgmt'

if (!MONGODB_URI) {
  console.error("MONGODB_URI env var is required");
  process.exit(1);
}

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["OPS", "FINANCE"], required: true },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

async function main() {
  await mongoose.connect(MONGODB_URI, { dbName: DB_NAME });

  const users = [
    { email: "ops@demo.com", password: "ops123", role: "OPS" },
    { email: "finance@demo.com", password: "fin123", role: "FINANCE" },
  ];

  for (const u of users) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      console.log(`User ${u.email} already exists, skipping`);
      continue;
    }
    const hash = await bcrypt.hash(u.password, 10);
    await User.create({ email: u.email, passwordHash: hash, role: u.role });
    console.log(`Created user ${u.email} (${u.role})`);
  }

  await mongoose.disconnect();
  console.log("Seeding complete");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

