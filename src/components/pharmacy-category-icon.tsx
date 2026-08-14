import Image from "next/image";
import {
  Bandage,
  BriefcaseMedical,
  FlaskConical,
  HeartPulse,
  Pill,
  Sparkles,
  Stethoscope,
  Syringe,
  Thermometer,
  Wind,
  type LucideIcon,
} from "lucide-react";
import type { PharmacyCategory } from "@/lib/types";

// Categories are admin-defined free text (see PharmacyCategory), so these
// maps can't be exhaustive -- anything outside the known set falls back to
// DEFAULT_ICON / DEFAULT_TINT below rather than crashing.
const iconMap: Partial<Record<PharmacyCategory, LucideIcon>> = {
  "Pain relief": Pill,
  Allergy: Wind,
  Antibiotics: FlaskConical,
  "Vitamins & supplements": Sparkles,
  Supplements: Sparkles,
  "Hospital tools": BriefcaseMedical,
  "Medical devices": Stethoscope,
  "Wound care": Syringe,
  "First aid": Bandage,
  "Cold & flu": Thermometer,
  "Chronic condition": HeartPulse,
};

const tintMap: Partial<Record<PharmacyCategory, string>> = {
  "Pain relief": "from-primary/25 via-primary/10 to-transparent text-primary",
  Allergy: "from-info/25 via-info/10 to-transparent text-info",
  Antibiotics: "from-pending/25 via-pending/10 to-transparent text-pending",
  "Vitamins & supplements": "from-emerald-500/25 via-emerald-500/10 to-transparent text-emerald-600",
  Supplements: "from-emerald-500/25 via-emerald-500/10 to-transparent text-emerald-600",
  "Hospital tools": "from-slate-500/20 via-slate-500/10 to-transparent text-slate-600",
  "Medical devices": "from-info/25 via-info/10 to-transparent text-info",
  "Wound care": "from-rose-500/20 via-rose-500/10 to-transparent text-rose-600",
  "First aid": "from-urgent/20 via-urgent/8 to-transparent text-urgent",
  "Cold & flu": "from-brand-teal/25 via-brand-teal/10 to-transparent text-brand-teal-foreground",
  "Chronic condition": "from-primary/25 via-primary/10 to-transparent text-primary",
};

const DEFAULT_ICON = Pill;
const DEFAULT_TINT = "from-primary/25 via-primary/10 to-transparent text-primary";

export function PharmacyProductTile({
  category,
  photoUrl,
  className,
}: {
  category: PharmacyCategory;
  photoUrl?: string;
  className?: string;
}) {
  if (photoUrl) {
    return (
      <div className={`relative overflow-hidden rounded-xl bg-secondary ${className ?? ""}`}>
        <Image src={photoUrl} alt="" fill sizes="200px" className="object-cover" />
      </div>
    );
  }

  const Icon = iconMap[category] ?? DEFAULT_ICON;
  return (
    <div
      className={`flex items-center justify-center rounded-xl bg-gradient-to-br ${tintMap[category] ?? DEFAULT_TINT} ${className ?? ""}`}
    >
      <Icon className="size-8" strokeWidth={1.5} />
    </div>
  );
}
