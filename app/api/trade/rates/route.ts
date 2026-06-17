import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import GiftCardRate from "@/lib/models/GiftCardRate";

const DEFAULT_USD_CURRENCY = { code: "USD", symbol: "$", ratePerUnit: 1000, isActive: true };

// Default brands seeded on first request if DB is empty
const DEFAULT_BRANDS = [
  { brand: "Amazon",            slug: "amazon"      },
  { brand: "iTunes / Apple",    slug: "itunes"      },
  { brand: "Google Play",       slug: "google-play" },
  { brand: "Steam",             slug: "steam"       },
  { brand: "Xbox",              slug: "xbox"        },
  { brand: "Walmart",           slug: "walmart"     },
  { brand: "eBay",              slug: "ebay"        },
  { brand: "Netflix",           slug: "netflix"     },
  { brand: "Nike",              slug: "nike"        },
  { brand: "Sephora",           slug: "sephora"     },
  { brand: "Target",            slug: "target"      },
  { brand: "Best Buy",          slug: "best-buy"    },
  { brand: "Visa",              slug: "visa"        },
  { brand: "Mastercard",        slug: "mastercard"  },
  { brand: "American Express",  slug: "amex"        },
  { brand: "Razer Gold",        slug: "razer-gold"  },
];

function buildCurrencies(r: { currencies?: { code: string; symbol: string; ratePerUnit: number; isActive: boolean }[]; ratePerDollar?: number }) {
  if (r.currencies && r.currencies.length > 0) return r.currencies;
  return [{ ...DEFAULT_USD_CURRENCY, ratePerUnit: r.ratePerDollar ?? 1000 }];
}

export async function GET() {
  try {
    await connectDB();

    let rates = await GiftCardRate.find({ isActive: true }).lean();

    // Auto-seed defaults on first run
    if (rates.length === 0) {
      await GiftCardRate.insertMany(
        DEFAULT_BRANDS.map((b) => ({
          ...b,
          ratePerDollar: 1000,
          currencies: [{ ...DEFAULT_USD_CURRENCY }],
          isActive: true,
        }))
      );
      rates = await GiftCardRate.find({ isActive: true }).lean();
    }

    return NextResponse.json(
      {
        success: true,
        rates: rates.map((r) => ({
          brand:      r.brand,
          slug:       r.slug,
          currencies: buildCurrencies(r),
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/trade/rates]", error);
    return NextResponse.json(
      {
        success: true,
        rates: DEFAULT_BRANDS.map((b) => ({
          ...b,
          currencies: [{ ...DEFAULT_USD_CURRENCY }],
        })),
      },
      { status: 200 }
    );
  }
}
