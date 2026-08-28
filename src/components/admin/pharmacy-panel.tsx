"use client";

import { useActionState, useEffect, useId, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import {
  Edit3,
  Package,
  PackagePlus,
  Search,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { StatusPill, type StatusTone } from "@/components/admin/status-pill";
import { SubmitButton } from "@/components/submit-button";
import {
  createPharmacyItem,
  deletePharmacyItem,
  setPharmacyItemStatus,
  updatePharmacyItem,
  updatePharmacyOrderStatus,
  type PharmacyActionState,
} from "@/app/admin/pharmacy-actions";
import { adminPharmacyOrderStatusKey, t, type TranslationKey } from "@/lib/i18n";
import {
  KNOWN_PHARMACY_CATEGORIES,
  type Locale,
  type PharmacyCategory,
  type PharmacyItem,
  type PharmacyItemBadge,
  type PharmacyItemStatus,
  type PharmacyOrder,
  type PharmacyOrderStatus,
  type StockStatus,
} from "@/lib/types";

const orderStatusTone: Record<PharmacyOrderStatus, StatusTone> = {
  pending: "pending",
  preparing: "pending",
  ready_for_pickup: "info",
  out_for_delivery: "info",
  delivered: "positive",
  completed: "positive",
};

const stockTone: Record<StockStatus, StatusTone> = {
  in_stock: "positive",
  low_stock: "pending",
  out_of_stock: "urgent",
};

const itemStatusTone: Record<PharmacyItemStatus, StatusTone> = {
  published: "positive",
  coming_soon: "pending",
  hidden: "neutral",
};

const itemStatusLabel: Record<PharmacyItemStatus, string> = {
  published: "Published",
  coming_soon: "Coming soon",
  hidden: "Hidden",
};

const orderStatusOrder: PharmacyOrderStatus[] = [
  "pending",
  "preparing",
  "ready_for_pickup",
  "out_for_delivery",
  "delivered",
  "completed",
];

const stockOptions: StockStatus[] = ["in_stock", "low_stock", "out_of_stock"];
const stockLabel: Record<StockStatus, string> = {
  in_stock: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
};

const badgeOptions: PharmacyItemBadge[] = ["trending", "hot", "new", "sale"];
const badgeLabel: Record<PharmacyItemBadge, string> = {
  trending: "Trending",
  hot: "Hot",
  new: "New",
  sale: "Sale",
};
const badgeTone: Record<PharmacyItemBadge, StatusTone> = {
  trending: "info",
  hot: "urgent",
  new: "positive",
  sale: "pending",
};

const initialFormState: PharmacyActionState = { status: "idle", message: "" };

export function PharmacyPanel({
  locale,
  products,
  orders,
}: {
  locale: Locale;
  products: PharmacyItem[];
  orders: PharmacyOrder[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<PharmacyCategory | "all">("all");
  const [visibility, setVisibility] = useState<PharmacyItemStatus | "all">("all");
  const [orderPending, startOrderTransition] = useTransition();

  const categoryOptions = useMemo(() => {
    const present = new Set<string>(KNOWN_PHARMACY_CATEGORIES);
    for (const product of products) {
      if (product.category) present.add(product.category);
    }
    return Array.from(present).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesQuery =
        !needle ||
        product.medicineName.toLowerCase().includes(needle) ||
        (product.description ?? "").toLowerCase().includes(needle) ||
        product.category.toLowerCase().includes(needle);
      const matchesCategory = category === "all" || product.category === category;
      const matchesVisibility = visibility === "all" || product.status === visibility;
      return matchesQuery && matchesCategory && matchesVisibility;
    });
  }, [category, products, query, visibility]);

  const inventoryStats = useMemo(() => {
    const published = products.filter((product) => product.status === "published").length;
    const lowStock = products.filter((product) => product.stockStatus === "low_stock").length;
    const outOfStock = products.filter((product) => product.stockStatus === "out_of_stock").length;
    const prescriptionOnly = products.filter((product) => product.requiresPrescription).length;
    return { published, lowStock, outOfStock, prescriptionOnly };
  }, [products]);

  function handleOrderStatusChange(orderId: string, status: PharmacyOrderStatus) {
    const formData = new FormData();
    formData.set("orderId", orderId);
    formData.set("status", status);
    startOrderTransition(async () => {
      await updatePharmacyOrderStatus(formData);
    });
  }

  return (
    <Tabs defaultValue="products" className="gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Pharmacy management</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the e-pharmacy catalog, stock, and doctor-approved orders.
          </p>
        </div>
        <TabsList>
          <TabsTrigger value="products">
            <Package className="size-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="orders">
            <ShoppingBag className="size-4" />
            Orders
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="products" className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-5">
          <InventoryStat label="Total products" value={products.length} />
          <InventoryStat label="Published" value={inventoryStats.published} />
          <InventoryStat label="Low stock" value={inventoryStats.lowStock} tone="pending" />
          <InventoryStat label="Out of stock" value={inventoryStats.outOfStock} tone="pending" />
          <InventoryStat label="Prescription only" value={inventoryStats.prescriptionOnly} />
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-border bg-background p-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search medicine, category, or description"
              className="pl-8"
            />
          </div>
          <Select value={category} onValueChange={(value) => setCategory(value as PharmacyCategory | "all")}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categoryOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={visibility}
            onValueChange={(value) => setVisibility(value as PharmacyItemStatus | "all")}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="coming_soon">Coming soon</SelectItem>
              <SelectItem value="hidden">Hidden</SelectItem>
            </SelectContent>
          </Select>
          <PharmacyItemDialog mode="create" categoryOptions={categoryOptions} />
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Badge</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rules</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    {products.length === 0
                      ? "No products yet. Add your first one to start the catalog."
                      : t("admin_no_results", locale)}
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <ProductThumb product={product} />
                        <div className="min-w-0">
                          <p className="font-medium">{product.medicineName}</p>
                          <p className="line-clamp-1 max-w-72 text-xs text-muted-foreground">
                            {product.description || "No description yet."}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {product.form} · {product.strength}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{product.category}</TableCell>
                    <TableCell>
                      {product.badge ? (
                        <StatusPill tone={badgeTone[product.badge]}>{badgeLabel[product.badge]}</StatusPill>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums">TZS {product.unitPrice}</TableCell>
                    <TableCell>
                      <StatusPill tone={stockTone[product.stockStatus]}>
                        {stockLabel[product.stockStatus]}
                      </StatusPill>
                    </TableCell>
                    <TableCell>
                      <StatusPill tone={itemStatusTone[product.status]}>
                        {itemStatusLabel[product.status]}
                      </StatusPill>
                    </TableCell>
                    <TableCell>
                      {product.requiresPrescription ? (
                        <StatusPill tone="info">Prescription</StatusPill>
                      ) : (
                        <StatusPill tone="neutral">Public</StatusPill>
                      )}
                    </TableCell>
                    <TableCell className="pr-4">
                      <div className="flex justify-end gap-1.5">
                        <PharmacyItemDialog mode="edit" item={product} categoryOptions={categoryOptions} />
                        <ItemStatusForm
                          itemId={product.id}
                          currentStatus={product.status}
                        />
                        <form action={deletePharmacyItem}>
                          <input type="hidden" name="itemId" value={product.id} />
                          <SubmitButton
                            size="icon-sm"
                            variant="destructive"
                            aria-label={`Delete ${product.medicineName}`}
                          >
                            <Trash2 className="size-3.5" />
                          </SubmitButton>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      <TabsContent value="orders">
        <div className="overflow-x-auto rounded-xl border border-border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">{t("admin_col_patient_ref", locale)}</TableHead>
                <TableHead>{t("admin_col_items", locale)}</TableHead>
                <TableHead>{t("admin_col_fulfillment", locale)}</TableHead>
                <TableHead>{t("admin_col_total", locale)}</TableHead>
                <TableHead>{t("admin_col_status", locale)}</TableHead>
                <TableHead className="pr-4">{t("admin_col_actions", locale)}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    No pharmacy orders yet.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="pl-4 font-mono text-xs">{order.patientReference}</TableCell>
                    <TableCell className="max-w-56 text-muted-foreground">
                      <span className="line-clamp-1">
                        {order.items.map((item) => item.prescribedMedicationName).join(", ")}
                      </span>
                      {order.substitutionRequested ? (
                        <StatusPill tone="urgent" className="mt-1">
                          {t("admin_substitution_flag", locale)}
                        </StatusPill>
                      ) : null}
                    </TableCell>
                    <TableCell className="capitalize text-muted-foreground">
                      {order.fulfillmentMethod}
                    </TableCell>
                    <TableCell className="tabular-nums">TZS {order.total}</TableCell>
                    <TableCell>
                      <StatusPill tone={orderStatusTone[order.status]}>
                        {t(adminPharmacyOrderStatusKey[order.status] as TranslationKey, locale)}
                      </StatusPill>
                    </TableCell>
                    <TableCell className="pr-4">
                      <Select
                        value={order.status}
                        disabled={orderPending}
                        onValueChange={(value) =>
                          handleOrderStatusChange(order.id, value as PharmacyOrderStatus)
                        }
                      >
                        <SelectTrigger size="sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {orderStatusOrder.map((status) => (
                            <SelectItem key={status} value={status}>
                              {t(adminPharmacyOrderStatusKey[status] as TranslationKey, locale)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
    </Tabs>
  );
}

function ItemStatusForm({
  itemId,
  currentStatus,
}: {
  itemId: string;
  currentStatus: PharmacyItemStatus;
}) {
  const next = currentStatus === "hidden" ? "published" : "hidden";
  return (
    <form action={setPharmacyItemStatus}>
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="status" value={next} />
      <SubmitButton
        size="sm"
        variant="outline"
        aria-label={currentStatus === "hidden" ? "Publish product" : "Hide product"}
      >
        {currentStatus === "hidden" ? "Publish" : "Hide"}
      </SubmitButton>
    </form>
  );
}

function PharmacyItemDialog({
  mode,
  item,
  categoryOptions,
}: {
  mode: "create" | "edit";
  item?: PharmacyItem;
  categoryOptions: string[];
}) {
  const [open, setOpen] = useState(false);
  const action = mode === "create" ? createPharmacyItem : updatePharmacyItem;
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const [imageName, setImageName] = useState("");
  const [removeImage, setRemoveImage] = useState(false);
  const categoryListId = useId();

  useEffect(() => {
    // The table refreshes underneath via revalidatePath; just close once a
    // submission actually succeeds. Deferred a tick so this isn't a direct
    // synchronous setState-in-effect (React flags that as a footgun even
    // though it's a one-shot response to an async action completing, not a
    // derived-state loop).
    if (state.status !== "success") return;
    const timeoutId = setTimeout(() => setOpen(false), 0);
    return () => clearTimeout(timeoutId);
  }, [state]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setImageName("");
          setRemoveImage(false);
        }
      }}
    >
      {mode === "create" ? (
        <DialogTrigger render={<Button className="shrink-0" />}>
          <PackagePlus className="size-4" />
          Add product
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button size="icon-sm" variant="ghost" />} aria-label={`Edit ${item?.medicineName}`}>
          <Edit3 className="size-3.5" />
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add product" : `Edit ${item?.medicineName}`}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "New products are added as published by default and appear on the storefront right away."
              : "Changes apply to the live storefront as soon as you save."}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="grid gap-3">
          {mode === "edit" && item ? <input type="hidden" name="itemId" value={item.id} /> : null}

          {state.status === "error" ? (
            <p role="alert" className="rounded-lg bg-urgent-soft px-3 py-2 text-sm text-urgent">
              {state.message}
            </p>
          ) : null}

          <Field label="Medicine name">
            <Input
              name="medicineName"
              defaultValue={item?.medicineName}
              placeholder="Paracetamol 500mg"
              required
            />
          </Field>

          <Field label="Description">
            <Textarea
              name="description"
              defaultValue={item?.description}
              placeholder="Short customer-facing description and usage notes."
              className="min-h-20"
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Category">
              <Input
                name="category"
                list={categoryListId}
                defaultValue={item?.category ?? "Pain relief"}
                placeholder="Pain relief"
                required
              />
              <datalist id={categoryListId}>
                {categoryOptions.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </Field>
            <Field label="Price (TZS)">
              <Input
                name="unitPrice"
                defaultValue={item?.unitPrice}
                inputMode="numeric"
                placeholder="1500"
                required
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Form">
              <Input name="form" defaultValue={item?.form} placeholder="Tablet" />
            </Field>
            <Field label="Strength">
              <Input name="strength" defaultValue={item?.strength} placeholder="500mg" />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Stock">
              <Select name="stockStatus" defaultValue={item?.stockStatus ?? "in_stock"}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stockOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {stockLabel[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Store status">
              <Select name="status" defaultValue={item?.status ?? "published"}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="coming_soon">Coming soon</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Merchandising badge">
            <Select name="badge" defaultValue={item?.badge ?? "none"}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {badgeOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {badgeLabel[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
            <span>
              <span className="block font-medium">Requires prescription</span>
              <span className="text-xs text-muted-foreground">
                Only shows for patients with a doctor-signed prescription.
              </span>
            </span>
            <input
              name="requiresPrescription"
              type="checkbox"
              defaultChecked={item?.requiresPrescription}
              className="size-4 accent-primary"
            />
          </label>

          <Field label="Product image">
            <label className="flex h-20 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
              <PackagePlus className="size-4" />
              {imageName || (item?.photoUrl ? "Replace image" : "Choose image")}
              <input
                name="image"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                type="file"
                onChange={(event) => setImageName(event.target.files?.[0]?.name ?? "")}
              />
            </label>
            {item?.photoUrl && !removeImage ? (
              <label className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  name="removeImage"
                  type="checkbox"
                  checked={removeImage}
                  onChange={(event) => setRemoveImage(event.target.checked)}
                  className="size-3.5 accent-destructive"
                />
                Remove current image
              </label>
            ) : null}
          </Field>

          <Button type="submit" disabled={pending} className="mt-1">
            <PackagePlus className="size-4" />
            {pending ? "Saving..." : mode === "create" ? "Add product" : "Save changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

function InventoryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "pending";
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className={tone === "pending" && value > 0 ? "text-2xl font-semibold text-pending" : "text-2xl font-semibold"}>
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function ProductThumb({ product }: { product: PharmacyItem }) {
  if (product.photoUrl) {
    return (
      <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
        <Image
          alt=""
          className="size-full object-cover"
          height={48}
          src={product.photoUrl}
          width={48}
        />
      </div>
    );
  }

  return (
    <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-xs font-semibold text-primary">
      Rx
    </div>
  );
}
