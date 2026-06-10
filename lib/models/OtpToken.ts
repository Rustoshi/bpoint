import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOtpToken extends Document {
  userId: mongoose.Types.ObjectId;
  email: string;
  otpHash: string;
  purpose: "email_verification" | "password_reset";
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
}

const OtpTokenSchema = new Schema<IOtpToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ["email_verification", "password_reset"],
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
      max: [5, "Too many failed attempts"],
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// TTL index — MongoDB auto-deletes expired tokens
OtpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
OtpTokenSchema.index({ userId: 1, purpose: 1 });

const OtpToken: Model<IOtpToken> =
  mongoose.models.OtpToken ?? mongoose.model<IOtpToken>("OtpToken", OtpTokenSchema);

export default OtpToken;
