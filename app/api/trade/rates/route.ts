import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import GiftCardRate from "@/lib/models/GiftCardRate";

// Default brands seeded on first request if DB is empty
const DEFAULT_BRANDS = [
  { brand: "Amazon",            slug: "amazon",       ratePerDollar: 1000 },
  { brand: "iTunes / Apple",    slug: "itunes",       ratePerDollar: 1000 },
  { brand: "Google Play",       slug: "google-play",  ratePerDollar: 1000 },
  { brand: "Steam",             slug: "steam",        ratePerDollar: 1000 },
  { brand: "Xbox",              slug: "xbox",         ratePerDollar: 1000 },
  { brand: "Walmart",           slug: "walmart",      ratePerDollar: 1000 },
  { brand: "eBay",              slug: "ebay",         ratePerDollar: 1000 },
  { brand: "Netflix",           slug: "netflix",      ratePerDollar: 1000 },
  { brand: "Nike",              slug: "nike",         ratePerDollar: 1000 },
  { brand: "Sephora",           slug: "sephora",      ratePerDollar: 1000 },
  { brand: "Target",            slug: "target",       ratePerDollar: 1000 },
  { brand: "Best Buy",          slug: "best-buy",     ratePerDollar: 1000 },
  { brand: "Visa",              slug: "visa",         ratePerDollar: 1000 },
  { brand: "Mastercard",        slug: "mastercard",   ratePerDollar: 1000 },
  { brand: "American Express",  slug: "amex",         ratePerDollar: 1000 },
  { brand: "Razer Gold",        slug: "razer-gold",   ratePerDollar: 1000 },
];

export async function GET() {
  try {
    await connectDB();

    let rates = await GiftCardRate.find({ isActive: true }).lean();

    // Auto-seed defaults on first run
    if (rates.length === 0) {
      await GiftCardRate.insertMany(
        DEFAULT_BRANDS.map((b) => ({ ...b, isActive: true }))
      );
      rates = await GiftCardRate.find({ isActive: true }).lean();
    }

    return NextResponse.json(
      {
        success: true,
        rates: rates.map((r) => ({
          brand: r.brand,
          slug: r.slug,
          ratePerDollar: r.ratePerDollar,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/trade/rates]", error);
    // Return hardcoded defaults on DB failure so the page still works
    return NextResponse.json(
      {
        success: true,
        rates: DEFAULT_BRANDS.map((b) => ({ ...b })),
      },
      { status: 200 }
    );
  }
}
