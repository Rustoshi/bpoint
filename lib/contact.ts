import { connectDB } from "@/lib/mongodb";
import { getSiteConfig } from "@/lib/models/SiteConfig";

export type ContactInfo = {
  supportEmail:   string;
  whatsappNumber: string;     // digits only, e.g. "2348012345678"
  whatsappLink:   string;     // https://wa.me/<digits>
  whatsappPretty: string;     // +234 801 234 5678
};

function formatWhatsApp(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  // Group as +CC X XXX XXX XXXX or similar; keep it simple and readable.
  if (digits.length <= 3) return `+${digits}`;
  const cc = digits.slice(0, digits.length - 10);
  const rest = digits.slice(-10).replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");
  return cc ? `+${cc} ${rest}` : `+${rest}`;
}

export async function loadContactInfo(): Promise<ContactInfo> {
  await connectDB();
  const cfg = await getSiteConfig();
  const email   = String(cfg.supportEmail   ?? "").trim();
  const wa      = String(cfg.whatsappNumber ?? "").replace(/\D/g, "");
  return {
    supportEmail:   email,
    whatsappNumber: wa,
    whatsappLink:   wa ? `https://wa.me/${wa}` : "#",
    whatsappPretty: formatWhatsApp(wa),
  };
}
