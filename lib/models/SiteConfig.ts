import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Single-document collection — always upserted by key "default".
 * Admin can update these values via the admin panel.
 */
export interface ISiteConfig extends Document {
  key: string;
  recoveryFeeNGN: number;
  consignmentFeeNGN: number;
  editingFeeNGN: number;
  lipsyncFeeNGN: number;
  dollarToNairaRate: number;
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
  supportEmail: string;
  whatsappNumber: string;
  updatedAt: Date;
}

const SiteConfigSchema = new Schema<ISiteConfig>(
  {
    key: { type: String, default: "default", unique: true },
    recoveryFeeNGN: { type: Number, default: 500, min: 0 },
    consignmentFeeNGN: { type: Number, default: 1000, min: 0 },
    editingFeeNGN: { type: Number, default: 800, min: 0 },
    lipsyncFeeNGN: { type: Number, default: 1500, min: 0 },
    dollarToNairaRate: { type: Number, default: 1000, min: 1 },
    bankAccountName: { type: String, default: "BPoint Nigeria Ltd", trim: true },
    bankAccountNumber: { type: String, default: "0000000000", trim: true },
    bankName: { type: String, default: "GTBank", trim: true },
    supportEmail:   { type: String, default: "support@bpoint.pro", trim: true, lowercase: true },
    whatsappNumber: { type: String, default: "2348000000000",     trim: true },
  },
  { timestamps: true }
);

const SiteConfig: Model<ISiteConfig> =
  mongoose.models.SiteConfig ??
  mongoose.model<ISiteConfig>("SiteConfig", SiteConfigSchema);

export default SiteConfig;

const DEFAULTS = {
  recoveryFeeNGN:    500,
  consignmentFeeNGN: 1000,
  editingFeeNGN:     800,
  lipsyncFeeNGN:     1500,
  dollarToNairaRate: 1000,
  bankAccountName:   "BPoint Nigeria Ltd",
  bankAccountNumber: "0000000000",
  bankName:          "GTBank",
  supportEmail:      "support@bpoint.pro",
  whatsappNumber:    "2348000000000",
};

/**
 * Fetch the singleton config, creating it if missing.
 * Also backfills any individual field that is null/undefined/empty so old
 * documents created before a schema field existed don't return blank values.
 */
export async function getSiteConfig(): Promise<ISiteConfig> {
  let config = await SiteConfig.findOne({ key: "default" });
  if (!config) {
    config = await SiteConfig.create({ key: "default" });
  }

  let mutated = false;
  for (const [k, v] of Object.entries(DEFAULTS) as [keyof typeof DEFAULTS, string | number][]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const current = (config as any)[k];
    const missing = typeof v === "string"
      ? (typeof current !== "string" || current.length === 0)
      : (typeof current !== "number" || !Number.isFinite(current));
    if (missing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (config as any)[k] = v;
      mutated = true;
    }
  }
  if (mutated) await config.save();

  return config;
}
