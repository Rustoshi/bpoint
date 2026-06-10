import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAccessToken } from "@/lib/jwt";
import GiftCardRate from "@/lib/models/GiftCardRate";

function requireAdmin(req: NextRequest): boolean {
  const h = req.headers.get("authorization") ?? "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return false;
  try { return verifyAccessToken(token).role === "admin"; }
  catch { return false; }
}

type RateInput = {
  brand: string;
  slug?: string;
  ratePerDollar: number;
  isActive?: boolean;
};

function slugify(s: string): string {
  return s.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function PUT(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 });
  }

  const body = await req.json().catch(() => null) as { rates?: RateInput[] } | null;
  if (!body || !Array.isArray(body.rates)) {
    return NextResponse.json({ success: false, message: "Body must include a rates array." }, { status: 400 });
  }

  // ── Validate + normalise ────────────────────────────────────────────────
  const cleaned: { brand: string; slug: string; ratePerDollar: number; isActive: boolean }[] = [];
  const seenSlugs = new Set<string>();

  for (const r of body.rates) {
    const brand = String(r.brand ?? "").trim();
    if (!brand) {
      return NextResponse.json({ success: false, message: "Every rate needs a brand name." }, { status: 400 });
    }
    const slug = (r.slug ? String(r.slug) : slugify(brand)).toLowerCase().trim();
    if (!slug) {
      return NextResponse.json({ success: false, message: `Could not derive a slug for "${brand}".` }, { status: 400 });
    }
    if (seenSlugs.has(slug)) {
      return NextResponse.json({ success: false, message: `Duplicate slug "${slug}".` }, { status: 400 });
    }
    seenSlugs.add(slug);

    const rate = Number(r.ratePerDollar);
    if (!Number.isFinite(rate) || rate < 1) {
      return NextResponse.json({ success: false, message: `Rate for "${brand}" must be at least 1.` }, { status: 400 });
    }

    cleaned.push({
      brand,
      slug,
      ratePerDollar: rate,
      isActive: r.isActive !== false,
    });
  }

  try {
    await connectDB();

    // Upsert every submitted rate
    await Promise.all(cleaned.map((r) =>
      GiftCardRate.findOneAndUpdate(
        { slug: r.slug },
        { $set: r },
        { new: true, upsert: true }
      )
    ));

    // Deactivate any brand that was removed from the form
    const keepSlugs = cleaned.map((r) => r.slug);
    await GiftCardRate.updateMany(
      { slug: { $nin: keepSlugs } },
      { $set: { isActive: false } }
    );

    const rates = await GiftCardRate.find({}).sort({ brand: 1 }).lean();

    return NextResponse.json({
      success: true,
      rates: rates.map((r) => ({
        id:            String(r._id),
        brand:         r.brand,
        slug:          r.slug,
        ratePerDollar: r.ratePerDollar,
        isActive:      r.isActive,
      })),
    });
  } catch (err) {
    console.error("[PUT /api/admin/settings/rates]", err);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}
