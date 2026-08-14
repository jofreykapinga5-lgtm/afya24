"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, Minus, Package, Plus, Search, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PharmacyProductTile } from "@/components/pharmacy-category-icon";
import { useAppStore } from "@/lib/store";
import type { Locale, PharmacyCategory, PharmacyItem } from "@/lib/types";
import { pharmacyCategoryKey, t, type TranslationKey } from "@/lib/i18n";

const stockLabelKey: Record<string, { key: TranslationKey; className: string }> = {
  in_stock: { key: "pharmacy_stock_in", className: "text-emerald-600" },
  low_stock: { key: "pharmacy_stock_low", className: "text-pending" },
  out_of_stock: { key: "pharmacy_stock_out_full", className: "text-urgent" },
};

function ProductCard({
  item,
  locale,
  cartQuantity,
  onAdd,
  onPrescription,
}: {
  item: PharmacyItem;
  locale: Locale;
  cartQuantity: number;
  onAdd: (itemId: string) => void;
  onPrescription: (medicineName: string) => void;
}) {
  const stock = stockLabelKey[item.stockStatus];
  const outOfStock = item.stockStatus === "out_of_stock";

  return (
    <div className="group flex h-full flex-col rounded-2xl border border-border bg-white p-3 transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-22px_rgba(8,50,115,0.45)]">
      <PharmacyProductTile category={item.category} photoUrl={item.photoUrl} className="aspect-square w-full" />

      <div className="mt-3 min-w-0">
        <p className="line-clamp-2 text-sm font-semibold leading-snug">{item.medicineName}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {item.form} · {item.strength}
        </p>
        <p className={`mt-1 text-xs font-medium ${stock.className}`}>{t(stock.key, locale)}</p>
      </div>

      <div className="mt-auto pt-3">
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-[11px] text-muted-foreground">{t("pharmacy_price_label", locale)}</p>
            <p className="font-semibold text-primary">TZS {item.unitPrice}</p>
          </div>
          {item.requiresPrescription ? (
            <button
              type="button"
              onClick={() => onPrescription(item.medicineName)}
              className="inline-flex h-9 items-center gap-1 rounded-full border border-border px-3 text-xs font-medium text-muted-foreground outline-none transition-colors hover:border-primary/40 hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Lock className="size-3" />
              {t("pharmacy_requires_rx", locale)}
            </button>
          ) : (
            <button
              type="button"
              disabled={outOfStock}
              onClick={() => onAdd(item.id)}
              className="inline-flex h-9 items-center rounded-full bg-primary px-3 text-xs font-semibold text-white outline-none transition-colors hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cartQuantity > 0 ? `${t("pharmacy_in_cart", locale)} (${cartQuantity})` : t("pharmacy_add_to_cart", locale)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function PharmacyCatalog({ items, locale }: { items: PharmacyItem[]; locale: Locale }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<PharmacyCategory | "All">("All");
  const cart = useAppStore((state) => state.pharmacyCart);
  const addToCart = useAppStore((state) => state.addToPharmacyCart);
  const removeFromCart = useAppStore((state) => state.removeFromPharmacyCart);
  const setQuantity = useAppStore((state) => state.setPharmacyCartQuantity);
  const setQualificationComplaint = useAppStore((state) => state.setQualificationComplaint);

  const categories = useMemo(() => {
    const present = new Set(items.map((item) => item.category));
    return ["All", ...Array.from(present)] as (PharmacyCategory | "All")[];
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory = category === "All" || item.category === category;
      const search = query.trim().toLowerCase();
      const matchesQuery =
        !search ||
        item.medicineName.toLowerCase().includes(search) ||
        item.category.toLowerCase().includes(search) ||
        (item.description ?? "").toLowerCase().includes(search);
      return matchesCategory && matchesQuery;
    });
  }, [items, query, category]);

  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const cartLines = cart
    .map((line) => ({ line, item: items.find((item) => item.id === line.itemId) }))
    .filter((entry) => entry.item);
  const subtotal = cartLines.reduce(
    (sum, entry) => sum + (entry.item?.unitPrice ?? 0) * entry.line.quantity,
    0
  );

  function startAssessmentForPrescription(medicineName: string) {
    setQualificationComplaint(`I need a prescription for ${medicineName}.`);
    router.push("/qualification");
  }

  function cartQuantityFor(itemId: string) {
    return cart.find((line) => line.itemId === itemId)?.quantity ?? 0;
  }

  return (
    <main className="flex-1 bg-white">
      <div className="border-b border-border bg-primary py-2 text-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 text-xs sm:px-6">
          <span className="font-semibold">{t("pharmacy_topbar_name", locale)}</span>
          <span className="hidden text-white/75 sm:inline">{t("pharmacy_topbar_tagline", locale)}</span>
          <span className="text-white/75">{t("pharmacy_topbar_support", locale)}</span>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1 rounded-sm text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <ArrowLeft className="size-3.5" />
            {t("back_to_home", locale)}
          </Link>

          <div className="hidden flex-1 justify-center lg:flex">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("pharmacy_search_medicines_placeholder", locale)}
                className="h-10 w-full rounded-full border border-border bg-secondary/70 pl-9 pr-4 text-sm outline-none focus-visible:ring-3 focus-visible:ring-primary/20"
              />
            </div>
          </div>

          <CartSheet
            cartCount={cartCount}
            cartLines={cartLines}
            locale={locale}
            subtotal={subtotal}
            addToCart={addToCart}
            removeFromCart={removeFromCart}
            setQuantity={setQuantity}
          />
        </div>

        <div className="mt-6">
          <h1 className="text-2xl font-semibold tracking-tight">{t("pharmacy_categories_title", locale)}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("pharmacy_hero_subtitle", locale)}
          </p>
        </div>

        <div className="relative mt-5 w-full sm:hidden">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("pharmacy_search_medicines_placeholder", locale)}
            className="h-10 w-full rounded-full border border-border bg-secondary/70 pl-9 pr-4 text-sm outline-none focus-visible:ring-3 focus-visible:ring-primary/20"
          />
        </div>

        {items.length > 0 && (
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`inline-flex h-9 shrink-0 items-center rounded-full border px-3 text-xs font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 ${
                  category === cat
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-white text-muted-foreground hover:border-primary/40 hover:bg-primary-soft"
                }`}
              >
                {t(pharmacyCategoryKey[cat], locale)}
              </button>
            ))}
          </div>
        )}

        {items.length === 0 ? (
          <div className="mt-14 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Package className="size-6" />
            </span>
            <p className="text-base font-semibold">{t("pharmacy_catalog_empty_title", locale)}</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {t("pharmacy_catalog_empty_body", locale)}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            {t("pharmacy_no_medicines_match", locale)} &ldquo;{query}&rdquo;.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                locale={locale}
                cartQuantity={cartQuantityFor(item.id)}
                onAdd={addToCart}
                onPrescription={startAssessmentForPrescription}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function CartSheet({
  cartCount,
  cartLines,
  locale,
  subtotal,
  addToCart,
  removeFromCart,
  setQuantity,
}: {
  cartCount: number;
  cartLines: { line: { itemId: string; quantity: number }; item: PharmacyItem | undefined }[];
  locale: Locale;
  subtotal: number;
  addToCart: (itemId: string) => void;
  removeFromCart: (itemId: string) => void;
  setQuantity: (itemId: string, quantity: number) => void;
}) {
  return (
    <Sheet>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t("pharmacy_your_cart", locale)}</SheetTitle>
        </SheetHeader>

        {cartLines.length === 0 ? (
          <p className="px-4 text-sm text-muted-foreground">{t("pharmacy_cart_empty", locale)}</p>
        ) : (
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
            {cartLines.map(({ line, item }) => (
              <div key={line.itemId} className="flex items-start gap-3 border-b border-border pb-4">
                <PharmacyProductTile
                  category={item!.category}
                  photoUrl={item!.photoUrl}
                  className="size-14 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item!.medicineName}</p>
                  <p className="text-xs text-muted-foreground">
                    {item!.form} · TZS {item!.unitPrice}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      aria-label={t("pharmacy_decrease_qty", locale)}
                      onClick={() => setQuantity(line.itemId, line.quantity - 1)}
                      className="inline-flex size-7 items-center justify-center rounded-full border border-border outline-none hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <Minus className="size-3" />
                    </button>
                    <span className="w-5 text-center text-sm">{line.quantity}</span>
                    <button
                      type="button"
                      aria-label={t("pharmacy_increase_qty", locale)}
                      onClick={() => addToCart(line.itemId)}
                      className="inline-flex size-7 items-center justify-center rounded-full border border-border outline-none hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <Plus className="size-3" />
                    </button>
                    <button
                      type="button"
                      aria-label={t("pharmacy_remove_item", locale)}
                      onClick={() => removeFromCart(line.itemId)}
                      className="ml-auto inline-flex size-7 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-secondary hover:text-urgent focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-border px-4 py-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("pharmacy_subtotal", locale)}</span>
            <span className="font-semibold">TZS {subtotal}</span>
          </div>
          {cartLines.length === 0 ? (
            <Button className="mt-3 h-11 w-full gap-2 rounded-xl" disabled>
              {t("pharmacy_proceed_checkout", locale)}
            </Button>
          ) : (
            <Button
              className="mt-3 h-11 w-full gap-2 rounded-xl"
              nativeButton={false}
              render={<Link href="/pharmacy/checkout" />}
            >
              {t("pharmacy_proceed_checkout", locale)}
            </Button>
          )}
        </div>
      </SheetContent>

      <SheetTrigger render={<Button variant="outline" className="relative h-10 gap-2 rounded-full" />}>
        <ShoppingBag className="size-4" />
        {t("pharmacy_cart_button", locale)}
        {cartCount > 0 && (
          <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
            {cartCount}
          </span>
        )}
      </SheetTrigger>
    </Sheet>
  );
}
