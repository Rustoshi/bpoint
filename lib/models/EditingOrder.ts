import mongoose, { Schema, Document, Model } from "mongoose";

export type EditingStatus =
  | "pending"
  | "in-progress"
  | "delivered"
  | "cancelled";

export interface IEditingOrder extends Document {
  userId: mongoose.Types.ObjectId;
  editDescription: string;
  fileUrls: string[];
  fileTypes: ("image" | "document")[];
  additionalNotes?: string;
  feeChargedNGN: number;
  deliveryUrl?: string;
  status: EditingStatus;
  adminNote?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EditingOrderSchema = new Schema<IEditingOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    editDescription: { type: String, required: true, trim: true, minlength: 20 },
    fileUrls: { type: [String], required: true },
    fileTypes: { type: [String], enum: ["image", "document"], required: true },
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

const EditingOrder: Model<IEditingOrder> =
  mongoose.models.EditingOrder ??
  mongoose.model<IEditingOrder>("EditingOrder", EditingOrderSchema);

export default EditingOrder;
