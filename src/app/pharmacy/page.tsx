"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  Lock,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PharmacyProductTile } from "@/components/pharmacy-category-icon";
import { pharmacyItems } from "@/lib/mock-data";
import { useAppStore } from "@/lib/store";
import type { Locale, PharmacyCategory, PharmacyItem } from "@/lib/types";
import { pharmacyCategoryKey, t, type TranslationKey } from "@/lib/i18n";

const categories: (PharmacyCategory | "All")[] = [
  "All",
  "Hospital tools",
  "Medical devices",
  "Supplements",
  "Wound care",
  "First aid",
  "Pain relief",
  "Allergy",
  "Cold & flu",
  "Vitamins & supplements",
  "Antibiotics",
  "Chronic condition",
];

const featuredCategories: PharmacyCategory[] = [
  "Hospital tools",
  "Medical devices",
  "Supplements",
  "Wound care",
  "First aid",
  "Pain relief",
];

const categoryPreviewCards = featuredCategories
  .map((category) => ({
    category,
    item: pharmacyItems.find((item) => item.category === category),
    count: pharmacyItems.filter((item) => item.category === category).length,
  }))
  .filter((entry): entry is { category: PharmacyCategory; item: PharmacyItem; count: number } =>
    Boolean(entry.item)
  );

const promoItems = [
  pharmacyItems.find((item) => item.id === "rx-item-digital-thermometer"),
  pharmacyItems.find((item) => item.id === "rx-item-bp-monitor"),
  pharmacyItems.find((item) => item.id === "rx-item-stethoscope"),
].filter(Boolean) as PharmacyItem[];

const dealItems = [
  pharmacyItems.find((item) => item.id === "rx-item-zinc-vitamin-c"),
  pharmacyItems.find((item) => item.id === "rx-item-ors"),
  pharmacyItems.find((item) => item.id === "rx-item-sterile-gauze"),
  pharmacyItems.find((item) => item.id === "rx-item-exam-gloves"),
  pharmacyItems.find((item) => item.id === "rx-item-antiseptic"),
].filter(Boolean) as PharmacyItem[];

const heroItem = pharmacyItems.find((item) => item.id === "rx-item-paracetamol")!;
const equipmentHero = pharmacyItems.find((item) => item.id === "rx-item-bp-monitor")!;
const thermometer = pharmacyItems.find((item) => item.id === "rx-item-digital-thermometer")!;

const photographedFirst = [...pharmacyItems].sort((a, b) => {
  const aHasPhoto = a.photoUrl ? 0 : 1;
  const bHasPhoto = b.photoUrl ? 0 : 1;
  return aHasPhoto - bHasPhoto;
});
const bestSellers = photographedFirst.filter((item) => !item.requiresPrescription).slice(0, 8);

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
  compact = false,
}: {
  item: PharmacyItem;
  locale: Locale;
  cartQuantity: number;
  onAdd: (itemId: string) => void;
  onPrescription: (medicineName: string) => void;
  compact?: boolean;
}) {
  const stock = stockLabelKey[item.stockStatus];
  const outOfStock = item.stockStatus === "out_of_stock";

  return (
    <div className="group flex h-full flex-col rounded-2xl border border-border bg-white p-3 transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-22px_rgba(8,50,115,0.45)]">
      <div className="relative">
        <span className="absolute left-2 top-2 z-10 rounded-sm bg-urgent px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
          {t("pharmacy_sale_badge", locale)}
        </span>
        <PharmacyProductTile
          category={item.category}
          photoUrl={item.photoUrl}
          className={compact ? "aspect-[1.15] w-full" : "aspect-square w-full"}
        />
      </div>

      <div className="mt-3 min-w-0">
        <p className="line-clamp-2 text-sm font-semibold leading-snug">{item.medicineName}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {item.form} / {item.strength}
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

export default function PharmacyPage() {
  const router = useRouter();
  const locale = useAppStore((state) => state.locale);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<PharmacyCategory | "All">("All");
  const cart = useAppStore((state) => state.pharmacyCart);
  const addToCart = useAppStore((state) => state.addToPharmacyCart);
  const removeFromCart = useAppStore((state) => state.removeFromPharmacyCart);
  const setQuantity = useAppStore((state) => state.setPharmacyCartQuantity);
  const setQualificationComplaint = useAppStore((state) => state.setQualificationComplaint);

  const filtered = useMemo(() => {
    return pharmacyItems.filter((item) => {
      const matchesCategory = category === "All" || item.category === category;
      const search = query.trim().toLowerCase();
      const matchesQuery =
        !search ||
        item.medicineName.toLowerCase().includes(search) ||
        item.category.toLowerCase().includes(search) ||
        (item.description ?? "").toLowerCase().includes(search);
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const cartLines = cart
    .map((line) => ({
      line,
      item: pharmacyItems.find((item) => item.id === line.itemId),
    }))
    .filter((entry) => entry.item);
  const subtotal = cartLines.reduce(
    (sum, entry) => sum + (entry.item?.unitPrice ?? 0) * entry.line.quantity,
    0
  );

  function startAssessmentForPrescription(medicineName: string) {
    setQualificationComplaint(`I need a prescription for ${medicineName}.`);
    router.push("/qualification");
  }

  function goToCategory(cat: PharmacyCategory | "All") {
    setCategory(cat);
    setQuery("");
    document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
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

        <section className="mt-6 overflow-hidden rounded-2xl bg-[#eef5fb]">
          <div className="grid min-h-[340px] items-center gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[1fr_0.9fr]">
            <div className="max-w-xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#1f2937]">
                {t("pharmacy_hero_label", locale)}
              </p>
              <h1 className="mt-4 max-w-[18ch] text-3xl font-extrabold leading-tight tracking-[-0.02em] text-[#202020]">
                <span className="text-brand-teal">{t("pharmacy_hero_headline_accent", locale)}</span>{" "}
                {t("pharmacy_hero_headline_rest", locale)}
              </h1>
              <p className="mt-4 max-w-[45ch] text-sm leading-6 text-muted-foreground">
                {t("pharmacy_hero_subtitle", locale)}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button className="h-10 rounded-full px-5" onClick={() => goToCategory("Medical devices")}>
                  {t("pharmacy_promo_shop_now", locale)}
                </Button>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                  <ShieldCheck className="size-4" />
                  {t("pharmacy_hero_doctor_linked", locale)}
                </span>
              </div>
            </div>

            <div className="relative mx-auto flex w-full max-w-sm items-center justify-center">
              <div className="absolute right-0 top-8 z-10 flex size-16 items-center justify-center rounded-full bg-brand-teal text-center text-xs font-bold leading-tight text-white shadow-[0_16px_30px_-16px_rgba(1,183,187,0.8)]">
                {t("pharmacy_best_pick_badge", locale)}
              </div>
              <div className="relative aspect-square w-full max-w-[280px] overflow-hidden rounded-[1.25rem] bg-white shadow-[0_28px_60px_-35px_rgba(8,50,115,0.7)]">
                {heroItem.photoUrl ? (
                  <Image
                    src={heroItem.photoUrl}
                    alt={heroItem.medicineName}
                    fill
                    priority
                    sizes="280px"
                    className="object-cover"
                  />
                ) : (
                  <PharmacyProductTile category={heroItem.category} className="size-full" />
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-3">
          {promoItems.map((item, index) => (
            <PromoTile
              key={item.id}
              item={item}
              tone={index}
              locale={locale}
              onClick={() => goToCategory(item.category)}
            />
          ))}
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight">{t("pharmacy_categories_title", locale)}</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categoryPreviewCards.map(({ category: cat, item, count }) => (
              <CategoryShopCard
                key={cat}
                category={cat}
                count={count}
                item={item}
                locale={locale}
                onClick={() => goToCategory(cat)}
              />
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-primary/40 bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold tracking-tight">{t("pharmacy_deal_of_day_title", locale)}</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-urgent px-3 py-1 text-xs font-semibold text-white">
                <Clock3 className="size-3.5" />
                {t("pharmacy_deal_ends_in", locale)} 09:02:57
              </span>
            </div>
            <button
              type="button"
              onClick={() => goToCategory("All")}
              className="text-sm font-medium text-primary hover:underline"
            >
              {t("pharmacy_view_all_products", locale)}
            </button>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-5">
            {dealItems.map((item) => (
              <DealCard
                key={item.id}
                item={item}
                locale={locale}
                cartQuantity={cartQuantityFor(item.id)}
                onAdd={addToCart}
                onPrescription={startAssessmentForPrescription}
              />
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
          <FeatureBanner
            title={t("pharmacy_equipment_banner_title", locale)}
            subtitle={equipmentHero.medicineName}
            price={`TZS ${equipmentHero.unitPrice}`}
            item={equipmentHero}
            cta={t("pharmacy_shop_equipment_cta", locale)}
            onClick={() => goToCategory("Hospital tools")}
          />
          <FeatureBanner
            title={t("pharmacy_home_supplies_banner_title", locale)}
            subtitle={thermometer.medicineName}
            price={`TZS ${thermometer.unitPrice}`}
            item={thermometer}
            cta={t("pharmacy_view_devices_cta", locale)}
            compact
            onClick={() => goToCategory("Medical devices")}
          />
        </section>

        <section id="catalog" className="mt-14 scroll-mt-20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">{t("pharmacy_best_selling_title", locale)}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("pharmacy_best_selling_subtitle", locale)}
              </p>
            </div>
            <div className="relative w-full sm:max-w-xs lg:hidden">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("pharmacy_search_medicines_placeholder", locale)}
                className="h-10 w-full rounded-full border border-border bg-secondary/70 pl-9 pr-4 text-sm outline-none focus-visible:ring-3 focus-visible:ring-primary/20"
              />
            </div>
          </div>

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

          {filtered.length === 0 ? (
            <p className="mt-10 text-center text-sm text-muted-foreground">
              {t("pharmacy_no_medicines_match", locale)} &ldquo;{query}&rdquo;.
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {(query.trim() || category !== "All" ? filtered : bestSellers).map((item) => (
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
        </section>
      </div>
    </main>
  );
}

function PromoTile({
  item,
  tone,
  locale,
  onClick,
}: {
  item: PharmacyItem;
  tone: number;
  locale: Locale;
  onClick: () => void;
}) {
  const tones = ["bg-[#f7f1eb]", "bg-[#e9f6f6]", "bg-[#eaf1ff]"];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group grid min-h-40 grid-cols-[1fr_120px] items-center gap-3 overflow-hidden rounded-2xl p-5 text-left outline-none transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-24px_rgba(8,50,115,0.5)] focus-visible:ring-3 focus-visible:ring-ring/50 ${tones[tone % tones.length]}`}
    >
      <span className="min-w-0">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {t(pharmacyCategoryKey[item.category], locale)}
        </span>
        <span className="mt-1 block text-base font-semibold leading-tight">{item.medicineName}</span>
        <span className="mt-1 block font-semibold text-primary">TZS {item.unitPrice}</span>
        <span className="mt-4 inline-flex items-center rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white">
          {t("pharmacy_promo_shop_now", locale)}
        </span>
      </span>
      <PharmacyProductTile category={item.category} photoUrl={item.photoUrl} className="aspect-square w-full" />
    </button>
  );
}

function CategoryShopCard({
  category,
  count,
  item,
  locale,
  onClick,
}: {
  category: PharmacyCategory;
  count: number;
  item: PharmacyItem;
  locale: Locale;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group grid min-h-48 grid-cols-[1fr_116px] items-center gap-4 rounded-2xl border border-border bg-white p-4 text-left outline-none transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_18px_36px_-24px_rgba(8,50,115,0.55)] focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className="min-w-0">
        <span className="inline-flex rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary">
          {t("pharmacy_items_count", locale).replace("{n}", String(count))}
        </span>
        <span className="mt-3 block text-xl font-semibold leading-tight">
          {t(pharmacyCategoryKey[category], locale)}
        </span>
        <span className="mt-2 block line-clamp-2 text-sm leading-5 text-muted-foreground">
          {t("pharmacy_featured_prefix", locale)}: {item.medicineName}
        </span>
        <span className="mt-3 block text-sm font-semibold text-primary">
          {t("pharmacy_hero_price_label", locale)} TZS {item.unitPrice}
        </span>
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
          {t("pharmacy_shop_category_cta", locale)}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </span>
      <span className="relative">
        <PharmacyProductTile category={item.category} photoUrl={item.photoUrl} className="aspect-square w-full" />
        <span className="absolute -bottom-2 -left-2 flex size-10 items-center justify-center rounded-full bg-brand-teal text-xs font-bold text-white shadow-[0_12px_24px_-14px_rgba(1,183,187,0.8)]">
          Rx
        </span>
      </span>
    </button>
  );
}

function DealCard({
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
  return (
    <div className="flex min-h-64 flex-col">
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-sm bg-urgent px-1.5 py-0.5 text-[10px] font-bold text-white">-20%</span>
        {item.requiresPrescription ? <Lock className="size-4 text-muted-foreground" /> : null}
      </div>
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {t(pharmacyCategoryKey[item.category], locale)}
      </p>
      <p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug">{item.medicineName}</p>
      <p className="mt-1 text-sm font-semibold text-primary">TZS {item.unitPrice}</p>
      <PharmacyProductTile category={item.category} photoUrl={item.photoUrl} className="my-4 aspect-square w-full" />
      <button
        type="button"
        onClick={() => (item.requiresPrescription ? onPrescription(item.medicineName) : onAdd(item.id))}
        className="mt-auto h-9 rounded-full bg-primary px-3 text-xs font-semibold text-white outline-none transition-colors hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {item.requiresPrescription
          ? t("pharmacy_requires_rx", locale)
          : cartQuantity > 0
            ? `${t("pharmacy_in_cart", locale)} (${cartQuantity})`
            : t("pharmacy_add_to_cart", locale)}
      </button>
    </div>
  );
}

function FeatureBanner({
  title,
  subtitle,
  price,
  item,
  cta,
  compact,
  onClick,
}: {
  title: string;
  subtitle: string;
  price: string;
  item: PharmacyItem;
  cta: string;
  compact?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group grid min-h-56 grid-cols-1 items-center gap-4 overflow-hidden rounded-2xl bg-[#edf7fb] p-6 text-left outline-none transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-24px_rgba(8,50,115,0.5)] focus-visible:ring-3 focus-visible:ring-ring/50 ${
        compact ? "sm:grid-cols-[1fr_120px]" : "sm:grid-cols-[1fr_220px]"
      }`}
    >
      <span>
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{title}</span>
        <span className="mt-2 block text-2xl font-semibold leading-tight">{subtitle}</span>
        <span className="mt-2 block font-semibold text-primary">{price}</span>
        <span className="mt-5 inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white">
          {cta}
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </span>
      <PharmacyProductTile category={item.category} photoUrl={item.photoUrl} className="aspect-square w-full" />
    </button>
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
                    {item!.form} / TZS {item!.unitPrice}
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
