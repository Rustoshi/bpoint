import mongoose, { Schema, Document, Model } from "mongoose";

export type LipsyncStatus =
  | "pending"
  | "in-progress"
  | "delivered"
  | "cancelled";

export interface ILipsyncOrder extends Document {
  userId: mongoose.Types.ObjectId;
  lipsyncDescription: string;
  fileUrls: string[];
  fileTypes: ("video" | "audio" | "image")[];
  additionalNotes?: string;
  feeChargedNGN: number;
  deliveryUrl?: string;
  status: LipsyncStatus;
  adminNote?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LipsyncOrderSchema = new Schema<ILipsyncOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    lipsyncDescription: { type: String, required: true, trim: true, minlength: 20 },
    fileUrls: { type: [String], required: true },
    fileTypes: { type: [String], enum: ["video", "audio", "image"], required: true },
    additionalNotes: { type: String, trim: true },
    feeChargedNGN: { type: Number, required: true, min: 0 },
    deliveryUrl: { type: String },
    status: {
      type: String,
      enum: ["pending", "in-progress", "delivered", "cancelled"],
      default: "pending",
    },
    adminNote: { type: String },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

const LipsyncOrder: Model<ILipsyncOrder> =
  mongoose.models.LipsyncOrder ??
  mongoose.model<ILipsyncOrder>("LipsyncOrder", LipsyncOrderSchema);

export default LipsyncOrder;
