import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGiftCardRate extends Document {
  brand: string;
  slug: string;
  ratePerDollar: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

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
      required: true,
      default: 1000,
      min: [1, "Rate must be at least 1"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const GiftCardRate: Model<IGiftCardRate> =
  mongoose.models.GiftCardRate ??
  mongoose.model<IGiftCardRate>("GiftCardRate", GiftCardRateSchema);

export default GiftCardRate;
