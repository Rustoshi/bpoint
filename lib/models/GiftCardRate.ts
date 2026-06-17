import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICurrencyRate {
  code: string;       // ISO 4217, e.g. "USD", "GBP", "EUR"
  symbol: string;     // Display symbol, e.g. "$", "£", "€"
  ratePerUnit: number; // ₦ per 1 unit of this currency
  isActive: boolean;
}

export interface IGiftCardRate extends Document {
  brand: string;
  slug: string;
  /** @deprecated Use currencies[] instead. Kept for migration. */
  ratePerDollar: number;
  currencies: ICurrencyRate[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CurrencyRateSchema = new Schema<ICurrencyRate>(
  {
    code:        { type: String, required: true, uppercase: true, trim: true },
    symbol:      { type: String, required: true, trim: true },
    ratePerUnit: { type: Number, required: true, min: [1, "Rate must be at least 1"] },
    isActive:    { type: Boolean, default: true },
  },
  { _id: false }
);

const GiftCardRateSchema = new Schema<IGiftCardRate>(
  {
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    ratePerDollar: {
      type: Number,
      default: 1000,
      min: [1, "Rate must be at least 1"],
    },
    currencies: {
      type: [CurrencyRateSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

/**
 * Returns the active ₦-per-unit rate for the requested currency code.
 * Falls back to USD, then to the legacy ratePerDollar field.
 */
export function getCurrencyRate(
  doc: IGiftCardRate,
  currencyCode: string
): ICurrencyRate | null {
  const upper = currencyCode.toUpperCase();
  const match = doc.currencies.find((c) => c.code === upper && c.isActive);
  if (match) return match;
  const usd = doc.currencies.find((c) => c.code === "USD" && c.isActive);
  if (usd) return usd;
  if (doc.ratePerDollar) {
    return { code: "USD", symbol: "$", ratePerUnit: doc.ratePerDollar, isActive: true };
  }
  return null;
}

const GiftCardRate: Model<IGiftCardRate> =
  mongoose.models.GiftCardRate ??
  mongoose.model<IGiftCardRate>("GiftCardRate", GiftCardRateSchema);

export default GiftCardRate;
