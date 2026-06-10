import crypto from "crypto";
import bcrypt from "bcryptjs";

const OTP_LENGTH = Number(process.env.OTP_LENGTH ?? 6);
const OTP_EXPIRES_MINUTES = Number(process.env.OTP_EXPIRES_MINUTES ?? 10);
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

export function generateOtp(): string {
  const max = Math.pow(10, OTP_LENGTH);
  const raw = crypto.randomInt(0, max);
  return raw.toString().padStart(OTP_LENGTH, "0");
}

export async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, SALT_ROUNDS);
}

export async function verifyOtp(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}

export function otpExpiresAt(): Date {
  return new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);
}
