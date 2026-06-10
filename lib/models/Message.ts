import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMessage extends Document {
  userId: mongoose.Types.ObjectId;
  fromAdmin: boolean;
  body: string;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    fromAdmin: { type: Boolean, default: false },
    body: { type: String, required: true, trim: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const Message: Model<IMessage> =
  mongoose.models.Message ??
  mongoose.model<IMessage>("Message", MessageSchema);

export default Message;
