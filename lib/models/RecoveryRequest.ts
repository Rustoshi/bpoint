import mongoose, { Schema, Document, Model } from "mongoose";

export type IssueType =
  | "scratched-off"
  | "missing-code"
  | "damaged-card"
  | "not-loading"
  | "other";

export type RecoveryStatus =
  | "pending"
  | "reviewing"
  | "recovered"
  | "unrecoverable"
  | "cancelled";

export interface IRecoveryRequest extends Document {
  userId: mongoose.Types.ObjectId;
  brand: string;
  brandSlug: string;
  cardValueUSD: number;
  issueType: IssueType;
  issueDescription: string;
  imageUrls: string[];
  receiptUrl?: string;
  purchaseStore?: string;
  purchaseDate?: string;
  feeChargedNGN: number;
  recoveredCode?: string;
  status: RecoveryStatus;
  adminNote?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RecoveryRequestSchema = new Schema<IRecoveryRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    brand: { type: String, required: true, trim: true },
    brandSlug: { type: String, required: true, lowercase: true, trim: true },
    cardValueUSD: { type: Number, required: true, min: 1 },
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
    feeChargedNGN: { type: Number, required: true, min: 0 },
    recoveredCode: { type: String },
    status: {
      type: String,
      enum: ["pending", "reviewing", "recovered", "unrecoverable", "cancelled"],
      default: "pending",
    },
    adminNote: { type: String },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

const RecoveryRequest: Model<IRecoveryRequest> =
  mongoose.models.RecoveryRequest ??
  mongoose.model<IRecoveryRequest>("RecoveryRequest", RecoveryRequestSchema);

export default RecoveryRequest;
