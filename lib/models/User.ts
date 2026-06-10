import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  passwordHash: string;
  isEmailVerified: boolean;
  bankDetails: {
    accountNumber: string;
    bankName: string;
    nameOnBank: string;
  };
  role: "user" | "admin";
  walletBalance: number;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
      match: [/^(\+?234|0)[789][01]\d{8}$/, "Enter a valid Nigerian phone number"],
    },
    passwordHash: {
      type: String,
      required: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    bankDetails: {
      accountNumber: {
        type: String,
        required: [true, "Account number is required"],
        match: [/^\d{10}$/, "Account number must be 10 digits"],
      },
      bankName: {
        type: String,
        required: [true, "Bank name is required"],
        trim: true,
      },
      nameOnBank: {
        type: String,
        required: [true, "Name on bank account is required"],
        trim: true,
      },
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ phone: 1 });
UserSchema.index({ createdAt: -1 });

// Prevent returning passwordHash in JSON responses
UserSchema.set("toJSON", {
  transform(_doc, ret) {
    delete (ret as unknown as Record<string, unknown>).passwordHash;
    return ret;
  },
});

// Avoid model re-registration in Next.js hot reload
const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);

export default User;
