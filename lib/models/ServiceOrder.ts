import mongoose, { Schema, Document, Model } from "mongoose";

export type ServiceType = "lipsync" | "editing" | "consignment" | "code-recovery";
export type ServiceStatus = "pending" | "reviewing" | "approved" | "completed" | "rejected";

export interface IServiceOrder extends Document {
  userId: mongoose.Types.ObjectId;
  type: ServiceType;
  description: string;
  fileUrls: string[];
  notes?: string;
  status: ServiceStatus;
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceOrderSchema = new Schema<IServiceOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["lipsync", "editing", "consignment", "code-recovery"],
      required: true,
    },
    description: { type: String, required: true, trim: true },
    fileUrls: { type: [String], default: [] },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pending", "reviewing", "approved", "completed", "rejected"],
      default: "pending",
    },
    adminNote: { type: String },
  },
  { timestamps: true }
);

const ServiceOrder: Model<IServiceOrder> =
  mongoose.models.ServiceOrder ??
  mongoose.model<IServiceOrder>("ServiceOrder", ServiceOrderSchema);

export default ServiceOrder;
