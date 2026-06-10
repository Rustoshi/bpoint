import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getSiteConfig } from "@/lib/models/SiteConfig";

export async function GET() {
  try {
    await connectDB();
    const config = await getSiteConfig();
    return NextResponse.json({ success: true, feeNGN: config.lipsyncFeeNGN });
  } catch (error) {
    console.error("[GET /api/lipsync/fee]", error);
    return NextResponse.json({ success: true, feeNGN: 1500 });
  }
}
