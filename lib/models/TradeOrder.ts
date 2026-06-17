import mongoose, { Schema, Document, Model } from "mongoose";

export type TradeStatus = "pending" | "reviewing" | "approved" | "paid" | "rejected";
export type SubmissionType = "ecode" | "physical";

export interface ITradeOrder extends Document {
  userId: mongoose.Types.ObjectId;
  brand: string;
  brandSlug: string;
  cardValue: number;
  submissionType: SubmissionType;
  eCode?: string;
  ePin?: string;
  imageUrls: string[];
  currencyCode: string;
  currencySymbol: string;
  rateSnapshot: number;
  payoutNGN: number;
  bankSnapshot: {
    accountNumber: string;
    bankName: string;
    nameOnBank: string;
  };
  status: TradeStatus;
  adminNote?: string;
  reviewedAt?: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TradeOrderSchema = new Schema<ITradeOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    brand: { type: String, required: true, trim: true },
    brandSlug: { type: String, required: true, lowercase: true, trim: true },
    cardValue: { type: Number, required: true, min: [1, "Card value must be at least 1"] },
    submissionType: {
      type: String,
      enum: ["ecode", "physical"],
      required: true,
    },
    eCode: { type: String, trim: true },
    ePin: { type: String, trim: true },
    imageUrls: { type: [String], default: [] },
    currencyCode:   { type: String, default: "USD", trim: true, uppercase: true },
    currencySymbol: { type: String, default: "$",   trim: true },
    rateSnapshot: { type: Number, required: true },
    payoutNGN: { type: Number, required: true },
    bankSnapshot: {
      accountNumber: { type: String, required: true },
      bankName: { type: String, required: true },
      nameOnBank: { type: String, required: true },
    },
    status: {
      type: String,
      enum: ["pending", "reviewing", "approved", "paid", "rejected"],
      default: "pending",
    },
    adminNote: { type: String },
    reviewedAt: { type: Date },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

const TradeOrder: Model<ITradeOrder> =
  mongoose.models.TradeOrder ??
  mongoose.model<ITradeOrder>("TradeOrder", TradeOrderSchema);

export default TradeOrder;
