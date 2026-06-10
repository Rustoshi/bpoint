import mongoose, { Schema, Document, Model } from "mongoose";

export type FundStatus = "pending" | "approved" | "rejected";

export interface IFundRequest extends Document {
  userId: mongoose.Types.ObjectId;
  amountNGN: number;
  receiptUrl: string;
  status: FundStatus;
  adminNote?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FundRequestSchema = new Schema<IFundRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amountNGN: { type: Number, required: true, min: 100 },
    receiptUrl: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    adminNote: { type: String, trim: true },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

const FundRequest: Model<IFundRequest> =
  mongoose.models.FundRequest ??
  mongoose.model<IFundRequest>("FundRequest", FundRequestSchema);

export default FundRequest;
