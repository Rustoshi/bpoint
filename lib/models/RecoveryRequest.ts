import mongoose, { Schema, Document, Model } from "mongoose";

export type IssueType =
  | "scratched-off"
  | "missing-code"
  | "damaged-card"
  | "not-loading"
  | "other";

// Mirrors the gift-card trade lifecycle: when the missing code is recovered the
// card value is paid out to the user's bank account; otherwise it is rejected.
export type RecoveryStatus =
  | "pending"
  | "reviewing"
  | "approved"
  | "paid"
  | "rejected";

export interface IRecoveryRequest extends Document {
  userId: mongoose.Types.ObjectId;
  brand: string;
  brandSlug: string;
  cardValue: number;
  currencyCode: string;
  currencySymbol: string;
  issueType: IssueType;
  issueDescription: string;
  imageUrls: string[];
  receiptUrl?: string;
  purchaseStore?: string;
  purchaseDate?: string;
  rateSnapshot: number;
  payoutNGN: number;
  bankSnapshot: {
    accountNumber: string;
    bankName: string;
    nameOnBank: string;
  };
  status: RecoveryStatus;
  adminNote?: string;
  reviewedAt?: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RecoveryRequestSchema = new Schema<IRecoveryRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    brand: { type: String, required: true, trim: true },
    brandSlug: { type: String, required: true, lowercase: true, trim: true },
    cardValue:       { type: Number, required: true, min: 1 },
    currencyCode:   { type: String, default: "USD", trim: true, uppercase: true },
    currencySymbol: { type: String, default: "$",   trim: true },
    issueType: {
      type: String,
      enum: ["scratched-off", "missing-code", "damaged-card", "not-loading", "other"],
      required: true,
    },
    issueDescription: { type: String, required: true, trim: true, minlength: 10 },
    imageUrls: { type: [String], required: true },
    receiptUrl: { type: String },
    purchaseStore: { type: String, trim: true },
    purchaseDate: { type: String, trim: true },
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

const RecoveryRequest: Model<IRecoveryRequest> =
  mongoose.models.RecoveryRequest ??
  mongoose.model<IRecoveryRequest>("RecoveryRequest", RecoveryRequestSchema);

export default RecoveryRequest;
