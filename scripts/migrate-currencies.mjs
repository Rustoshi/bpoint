/**
 * One-time migration: converts legacy ratePerDollar on every GiftCardRate document
 * into the new currencies[] array (USD entry), leaving other currencies intact.
 *
 * Run with:
 *   pnpm node --env-file=.env.local scripts/migrate-currencies.mjs
 */

import mongoose from "mongoose";

const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error("MONGODB_URI is not set. Pass it via .env.local or environment.");
  process.exit(1);
}

await mongoose.connect(MONGO_URI);
console.log("Connected to MongoDB.");

const GiftCardRate = mongoose.model(
  "GiftCardRate",
  new mongoose.Schema({}, { strict: false })
);

const docs = await GiftCardRate.find({}).lean();
console.log(`Found ${docs.length} GiftCardRate documents.`);

let migrated = 0;

for (const doc of docs) {
  const currencies = Array.isArray(doc.currencies) ? doc.currencies : [];

  // Already has a USD entry — skip
  if (currencies.some((c) => c.code === "USD")) {
    console.log(`  SKIP  ${doc.brand} (already has USD currency entry)`);
    continue;
  }

  const ratePerDollar = typeof doc.ratePerDollar === "number" ? doc.ratePerDollar : 1000;

  await GiftCardRate.updateOne(
    { _id: doc._id },
    {
      $set: {
        currencies: [
          ...currencies,
          { code: "USD", symbol: "$", ratePerUnit: ratePerDollar, isActive: true },
        ],
      },
    }
  );

  console.log(`  MIGRATED  ${doc.brand} → USD @ ₦${ratePerDollar}`);
  migrated++;
}

console.log(`\nDone. ${migrated} document(s) migrated, ${docs.length - migrated} skipped.`);
await mongoose.disconnect();
