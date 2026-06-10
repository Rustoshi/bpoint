/**
 * Seed script — creates or updates the admin user.
 *
 * Required env vars (in .env.local or .env):
 *   MONGODB_URI
 *   ADMIN_EMAIL
 *   ADMIN_PASSWORD
 *   ADMIN_FIRST_NAME   (optional, default: "Admin")
 *   ADMIN_LAST_NAME    (optional, default: "User")
 *   BCRYPT_SALT_ROUNDS (optional, default: 12)
 *
 * Usage:
 *   npm run seed:admin
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// ── Validate required env vars ─────────────────────────────────────────────────

const MONGODB_URI    = process.env.MONGODB_URI;
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!MONGODB_URI)    { console.error("❌  Missing MONGODB_URI in env"); process.exit(1); }
if (!ADMIN_EMAIL)    { console.error("❌  Missing ADMIN_EMAIL in env"); process.exit(1); }
if (!ADMIN_PASSWORD) { console.error("❌  Missing ADMIN_PASSWORD in env"); process.exit(1); }

if (ADMIN_PASSWORD.length < 8) {
  console.error("❌  ADMIN_PASSWORD must be at least 8 characters");
  process.exit(1);
}

const FIRST_NAME   = process.env.ADMIN_FIRST_NAME ?? "Admin";
const LAST_NAME    = process.env.ADMIN_LAST_NAME  ?? "User";
const SALT_ROUNDS  = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

// ── Inline User schema (avoids importing Next.js module graph) ─────────────────

const UserSchema = new mongoose.Schema(
  {
    firstName:       { type: String, required: true, trim: true },
    lastName:        { type: String, required: true, trim: true },
    email:           { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone:           { type: String, default: "" },
    passwordHash:    { type: String, required: true },
    isEmailVerified: { type: Boolean, default: true },
    bankDetails: {
      accountNumber: { type: String, default: "" },
      bankName:      { type: String, default: "" },
      nameOnBank:    { type: String, default: "" },
    },
    role:          { type: String, enum: ["user", "admin"], default: "user" },
    walletBalance: { type: Number, default: 0 },
    isActive:      { type: Boolean, default: true },
    lastLoginAt:   { type: Date },
  },
  { timestamps: true }
);

const User = mongoose.models.User ?? mongoose.model("User", UserSchema);

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🔌  Connecting to MongoDB…");
  await mongoose.connect(MONGODB_URI as string);
  console.log("✅  Connected.");

  const email = (ADMIN_EMAIL as string).toLowerCase().trim();
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD as string, SALT_ROUNDS);

  const existing = await User.findOne({ email });

  if (existing) {
    if (existing.role !== "admin") {
      // Upgrade existing user to admin
      await User.updateOne({ email }, { role: "admin", passwordHash, isActive: true, isEmailVerified: true });
      console.log(`✅  Existing user ${email} upgraded to admin and password updated.`);
    } else {
      // Already admin — just update password
      await User.updateOne({ email }, { passwordHash, firstName: FIRST_NAME, lastName: LAST_NAME, isActive: true });
      console.log(`✅  Admin ${email} already exists — password and name updated.`);
    }
  } else {
    await User.create({
      firstName: FIRST_NAME,
      lastName:  LAST_NAME,
      email,
      phone:           "",
      passwordHash,
      isEmailVerified: true,
      role:            "admin",
      isActive:        true,
    });
    console.log(`✅  Admin user created: ${email}`);
  }

  await mongoose.disconnect();
  console.log("👋  Done.");
}

main().catch((err) => {
  console.error("❌  Seed failed:", err);
  process.exit(1);
});
