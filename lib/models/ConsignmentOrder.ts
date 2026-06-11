import mongoose, { Schema, Document, Model } from "mongoose";

export type ConsignmentStatus =
  | "pending"
  | "processing"
  | "delivered"
  | "cancelled";

export interface IConsignmentOrder extends Document {
  userId: mongoose.Types.ObjectId;
  boxDescription: string;
  videoInstructions: string;
  deliveryAddress?: string;
  additionalNotes?: string;
  receiverImageUrl?: string;
  feeChargedNGN: number;
  proofVideoUrl?: string;
  status: ConsignmentStatus;
  adminNote?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ConsignmentOrderSchema = new Schema<IConsignmentOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    boxDescription: { type: String, required: true, trim: true, minlength: 20 },
    videoInstructions: { type: String, required: true, trim: true, minlength: 10 },
    deliveryAddress: { type: String, trim: true },
    additionalNotes: { type: String, trim: true },
    receiverImageUrl: { type: String, trim: true },
    feeChargedNGN: { type: Number, required: true, min: 0 },
    proofVideoUrl: { type: String },
    status: {
      type: String,
      enum: ["pending", "processing", "delivered", "cancelled"],
      default: "pending",
    },
    adminNote: { type: String },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

const ConsignmentOrder: Model<IConsignmentOrder> =
  mongoose.models.ConsignmentOrder ??
  mongoose.model<IConsignmentOrder>("ConsignmentOrder", ConsignmentOrderSchema);

export default ConsignmentOrder;
