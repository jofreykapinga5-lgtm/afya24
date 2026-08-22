import "server-only";
import { getCachedPublishedPharmacyItems } from "@/lib/cache/public-catalog";
import type { PharmacyCategory, PharmacyItem, PharmacyItemBadge, StockStatus } from "@/lib/types";

type DbPharmacyItemRow = {
  id: string;
  medicine_name: string;
  category: string;
  description: string | null;
  form: string | null;
  strength: string | null;
  stock_status: string;
  unit_price: number | string;
  requires_prescription: boolean;
  photo_url: string | null;
  badge: string | null;
};

// Shared by the storefront and checkout -- both need the same published
// catalog, just filtered differently on the client (checkout only cares
// about whatever's actually in the cart).
export async function getPublishedPharmacyItems(): Promise<PharmacyItem[]> {
  const data = (await getCachedPublishedPharmacyItems()) as DbPharmacyItemRow[];

  return (data ?? []).map((item) => ({
    id: item.id,
    medicineName: item.medicine_name,
    category: item.category as PharmacyCategory,
    description: item.description ?? undefined,
    form: item.form ?? "Not set",
    strength: item.strength ?? "Not set",
    unitPrice: Number(item.unit_price),
    stockStatus: item.stock_status as StockStatus,
    requiresPrescription: item.requires_prescription,
    photoUrl: item.photo_url ?? undefined,
    status: "published",
    badge: (item.badge as PharmacyItemBadge | null) ?? undefined,
  }));
}
