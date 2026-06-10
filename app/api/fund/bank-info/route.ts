import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getSiteConfig } from "@/lib/models/SiteConfig";

export async function GET() {
  try {
    await connectDB();
    const config = await getSiteConfig();
    return NextResponse.json({
      success: true,
      bankInfo: {
        accountName: config.bankAccountName,
        accountNumber: config.bankAccountNumber,
        bankName: config.bankName,
      },
    });
  } catch (error) {
    console.error("[GET /api/fund/bank-info]", error);
    return NextResponse.json({ success: false, message: "Could not load bank details." }, { status: 500 });
  }
}
