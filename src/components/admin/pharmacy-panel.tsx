"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import {
  Edit3,
  Eye,
  EyeOff,
  ImagePlus,
  PackagePlus,
  Save,
  Search,
  ShoppingBag,
  Timer,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { adminPharmacyOrderStatusKey, t, type TranslationKey } from "@/lib/i18n";
import type {
  Locale,
  PharmacyCategory,
  PharmacyItem,
  PharmacyOrder,
  PharmacyOrderStatus,
  StockStatus,
} from "@/lib/types";

const statusTone: Record<PharmacyOrderStatus, StatusTone> = {
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

const statusOrder: PharmacyOrderStatus[] = [
  "pending",
  "preparing",
  "ready_for_pickup",
  "out_for_delivery",
  "delivered",
  "completed",
];

const stockOptions: StockStatus[] = ["in_stock", "low_stock", "out_of_stock"];

const categoryOptions: PharmacyCategory[] = [
  "Pain relief",
  "Allergy",
  "Antibiotics",
  "Vitamins & supplements",
  "Supplements",
  "Hospital tools",
  "Medical devices",
  "Wound care",
  "First aid",
  "Cold & flu",
  "Chronic condition",
];

const stockLabel: Record<StockStatus, string> = {
  in_stock: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
};

type ProductStatus = "published" | "coming_soon" | "hidden";

type AdminPharmacyItem = PharmacyItem & {
  productStatus: ProductStatus;
};

const productStatusLabel: Record<ProductStatus, string> = {
  published: "Published",
  coming_soon: "Coming soon",
  hidden: "Hidden",
};

const productStatusTone: Record<ProductStatus, StatusTone> = {
  published: "positive",
  coming_soon: "pending",
  hidden: "neutral",
};

function toAdminProduct(product: PharmacyItem): AdminPharmacyItem {
  return { ...product, productStatus: "published" };
}

export function PharmacyPanel({
  locale,
  products,
  orders,
  onStatusChange,
}: {
  locale: Locale;
  products: PharmacyItem[];
  orders: PharmacyOrder[];
  onStatusChange: (orderId: string, patientReference: string, next: PharmacyOrderStatus) => void;
}) {
  const [productState, setProductState] = useState<AdminPharmacyItem[]>(
    products.map(toAdminProduct)
  );
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<PharmacyCategory | "all">("all");
  const [visibility, setVisibility] = useState<ProductStatus | "all">("all");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<AdminPharmacyItem | null>(null);
  const [imageName, setImageName] = useState("");
  const [form, setForm] = useState({
    medicineName: "",
    category: "Pain relief" as PharmacyCategory,
    description: "",
    form: "",
    strength: "",
    unitPrice: "",
    stockStatus: "in_stock" as StockStatus,
    productStatus: "published" as ProductStatus,
    requiresPrescription: false,
  });

  const filteredProducts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return productState.filter((product) => {
      const matchesQuery =
        !needle ||
        product.medicineName.toLowerCase().includes(needle) ||
        (product.description ?? "").toLowerCase().includes(needle) ||
        product.category.toLowerCase().includes(needle);
      const matchesCategory = category === "all" || product.category === category;
      const matchesVisibility = visibility === "all" || product.productStatus === visibility;
      return matchesQuery && matchesCategory && matchesVisibility;
    });
  }, [category, productState, query, visibility]);

  const inventoryStats = useMemo(() => {
    const lowStock = productState.filter((product) => product.stockStatus === "low_stock").length;
    const outOfStock = productState.filter((product) => product.stockStatus === "out_of_stock").length;
    const prescriptionOnly = productState.filter((product) => product.requiresPrescription).length;
    const comingSoon = productState.filter((product) => product.productStatus === "coming_soon").length;
    const hidden = productState.filter((product) => product.productStatus === "hidden").length;
    return { lowStock, outOfStock, prescriptionOnly, comingSoon, hidden };
  }, [productState]);

  function handleAddProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const price = Number(form.unitPrice);
    if (!form.medicineName.trim() || !form.description.trim() || !price) {
      return;
    }

    const nextProduct: AdminPharmacyItem = {
      id: `rx-item-admin-${Date.now()}`,
      medicineName: form.medicineName.trim(),
      category: form.category,
      description: form.description.trim(),
      form: form.form.trim() || "Not set",
      strength: form.strength.trim() || "Not set",
      unitPrice: price,
      stockStatus: form.stockStatus,
      requiresPrescription: form.requiresPrescription,
      photoUrl: imageName ? `/uploads/${imageName}` : undefined,
      productStatus: form.productStatus,
    };

    setProductState((current) => [nextProduct, ...current]);
    setForm({
      medicineName: "",
      category: "Pain relief",
      description: "",
      form: "",
      strength: "",
      unitPrice: "",
      stockStatus: "in_stock",
      productStatus: "published",
      requiresPrescription: false,
    });
    setImageName("");
  }

  function startEdit(product: AdminPharmacyItem) {
    setEditingProductId(product.id);
    setEditDraft({ ...product });
  }

  function cancelEdit() {
    setEditingProductId(null);
    setEditDraft(null);
  }

  function saveEdit() {
    if (!editDraft) return;
    setProductState((current) =>
      current.map((product) => (product.id === editDraft.id ? editDraft : product))
    );
    cancelEdit();
  }

  function patchProduct(productId: string, patch: Partial<AdminPharmacyItem>) {
    setProductState((current) =>
      current.map((product) => (product.id === productId ? { ...product, ...patch } : product))
    );
  }

  function deleteProduct(productId: string) {
    setProductState((current) => current.filter((product) => product.id !== productId));
    if (editingProductId === productId) cancelEdit();
  }

  return (
    <Tabs defaultValue="products" className="gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Pharmacy management</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage e-pharmacy products, medicine descriptions, stock, prescription rules, and orders.
          </p>
        </div>
        <TabsList>
          <TabsTrigger value="products">
            <PackagePlus className="size-4" />
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
          <InventoryStat label="Total products" value={productState.length} />
          <InventoryStat label="Low stock" value={inventoryStats.lowStock} tone="pending" />
          <InventoryStat label="Out of stock" value={inventoryStats.outOfStock} tone="pending" />
          <InventoryStat label="Coming soon" value={inventoryStats.comingSoon} tone="pending" />
          <InventoryStat label="Hidden" value={inventoryStats.hidden} />
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.3fr]">
          <form onSubmit={handleAddProduct} className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-center gap-2">
              <PackagePlus className="size-4 text-primary" />
              <h4 className="text-sm font-semibold">Upload product</h4>
            </div>

            <div className="mt-4 grid gap-3">
              <Field label="Medicine name">
                <Input
                  value={form.medicineName}
                  onChange={(event) => setForm((current) => ({ ...current, medicineName: event.target.value }))}
                  placeholder="Paracetamol 500mg"
                />
              </Field>

              <Field label="Description">
                <Textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Short customer-facing description, usage notes, and important warning."
                  className="min-h-24"
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Category">
                  <Select
                    value={form.category}
                    onValueChange={(value) =>
                      setForm((current) => ({ ...current, category: value as PharmacyCategory }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Stock">
                  <Select
                    value={form.stockStatus}
                    onValueChange={(value) =>
                      setForm((current) => ({ ...current, stockStatus: value as StockStatus }))
                    }
                  >
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
              </div>

              <Field label="Store status">
                <Select
                  value={form.productStatus}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, productStatus: value as ProductStatus }))
                  }
                >
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

              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Form">
                  <Input
                    value={form.form}
                    onChange={(event) => setForm((current) => ({ ...current, form: event.target.value }))}
                    placeholder="Tablet"
                  />
                </Field>
                <Field label="Strength">
                  <Input
                    value={form.strength}
                    onChange={(event) => setForm((current) => ({ ...current, strength: event.target.value }))}
                    placeholder="500mg"
                  />
                </Field>
                <Field label="Price">
                  <Input
                    value={form.unitPrice}
                    onChange={(event) => setForm((current) => ({ ...current, unitPrice: event.target.value }))}
                    inputMode="numeric"
                    placeholder="150"
                  />
                </Field>
              </div>

              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
                <span>
                  <span className="block font-medium">Requires prescription</span>
                  <span className="text-xs text-muted-foreground">Show only when doctor signed a valid prescription.</span>
                </span>
                <input
                  checked={form.requiresPrescription}
                  className="size-4 accent-primary"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, requiresPrescription: event.target.checked }))
                  }
                  type="checkbox"
                />
              </label>

              <Field label="Product image">
                <label className="flex h-20 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
                  <ImagePlus className="size-4" />
                  {imageName || "Choose image"}
                  <input
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => setImageName(event.target.files?.[0]?.name ?? "")}
                    type="file"
                  />
                </label>
              </Field>

              <Button type="submit" className="mt-1">
                <PackagePlus className="size-4" />
                Add product
              </Button>
            </div>
          </form>

          <div className="space-y-3">
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
              <Select
                value={category}
                onValueChange={(value) => setCategory(value as PharmacyCategory | "all")}
              >
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
                onValueChange={(value) => setVisibility(value as ProductStatus | "all")}
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
            </div>

            <div className="rounded-xl border border-border bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rules</TableHead>
                    <TableHead className="pr-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="pl-4">
                        {editingProductId === product.id && editDraft ? (
                          <div className="grid gap-2">
                            <Input
                              value={editDraft.medicineName}
                              onChange={(event) =>
                                setEditDraft((current) =>
                                  current ? { ...current, medicineName: event.target.value } : current
                                )
                              }
                            />
                            <Textarea
                              value={editDraft.description ?? ""}
                              onChange={(event) =>
                                setEditDraft((current) =>
                                  current ? { ...current, description: event.target.value } : current
                                )
                              }
                              className="min-h-16 text-xs"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <ProductThumb product={product} />
                            <div className="min-w-0">
                              <p className="font-medium">{product.medicineName}</p>
                              <p className="line-clamp-1 text-xs text-muted-foreground">
                                {product.description ?? "No product description added yet."}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {product.form} / {product.strength}
                              </p>
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {editingProductId === product.id && editDraft ? (
                          <Select
                            value={editDraft.category}
                            onValueChange={(value) =>
                              setEditDraft((current) =>
                                current ? { ...current, category: value as PharmacyCategory } : current
                              )
                            }
                          >
                            <SelectTrigger className="w-44">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categoryOptions.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          product.category
                        )}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {editingProductId === product.id && editDraft ? (
                          <Input
                            value={String(editDraft.unitPrice)}
                            onChange={(event) =>
                              setEditDraft((current) =>
                                current ? { ...current, unitPrice: Number(event.target.value) || 0 } : current
                              )
                            }
                            className="w-24"
                            inputMode="numeric"
                          />
                        ) : (
                          `TZS ${product.unitPrice}`
                        )}
                      </TableCell>
                      <TableCell>
                        {editingProductId === product.id && editDraft ? (
                          <Select
                            value={editDraft.stockStatus}
                            onValueChange={(value) =>
                              setEditDraft((current) =>
                                current ? { ...current, stockStatus: value as StockStatus } : current
                              )
                            }
                          >
                            <SelectTrigger className="w-32">
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
                        ) : (
                          <StatusPill tone={stockTone[product.stockStatus]}>
                            {stockLabel[product.stockStatus]}
                          </StatusPill>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusPill tone={productStatusTone[product.productStatus]}>
                          {productStatusLabel[product.productStatus]}
                        </StatusPill>
                      </TableCell>
                      <TableCell className="pr-4">
                        {editingProductId === product.id && editDraft ? (
                          <label className="inline-flex items-center gap-2 text-xs">
                            <input
                              checked={editDraft.requiresPrescription}
                              className="size-4 accent-primary"
                              onChange={(event) =>
                                setEditDraft((current) =>
                                  current
                                    ? { ...current, requiresPrescription: event.target.checked }
                                    : current
                                )
                              }
                              type="checkbox"
                            />
                            Prescription
                          </label>
                        ) : product.requiresPrescription ? (
                          <StatusPill tone="info">Prescription</StatusPill>
                        ) : (
                          <StatusPill tone="neutral">Public</StatusPill>
                        )}
                      </TableCell>
                      <TableCell className="pr-4">
                        <div className="flex justify-end gap-1.5">
                          {editingProductId === product.id ? (
                            <>
                              <Button size="icon-sm" variant="outline" onClick={saveEdit} aria-label="Save product">
                                <Save className="size-3.5" />
                              </Button>
                              <Button size="icon-sm" variant="ghost" onClick={cancelEdit} aria-label="Cancel edit">
                                <X className="size-3.5" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button size="icon-sm" variant="ghost" onClick={() => startEdit(product)} aria-label="Edit product">
                                <Edit3 className="size-3.5" />
                              </Button>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                onClick={() =>
                                  patchProduct(product.id, {
                                    productStatus:
                                      product.productStatus === "coming_soon"
                                        ? "published"
                                        : "coming_soon",
                                  })
                                }
                                aria-label="Toggle coming soon"
                              >
                                <Timer className="size-3.5" />
                              </Button>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                onClick={() =>
                                  patchProduct(product.id, {
                                    productStatus:
                                      product.productStatus === "hidden" ? "published" : "hidden",
                                  })
                                }
                                aria-label="Toggle product visibility"
                              >
                                {product.productStatus === "hidden" ? (
                                  <Eye className="size-3.5" />
                                ) : (
                                  <EyeOff className="size-3.5" />
                                )}
                              </Button>
                              <Button
                                size="icon-sm"
                                variant="destructive"
                                onClick={() => deleteProduct(product.id)}
                                aria-label="Delete product"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="orders">
        <div className="rounded-xl border border-border bg-background">
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
              {orders.map((order) => (
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
                    <StatusPill tone={statusTone[order.status]}>
                      {t(adminPharmacyOrderStatusKey[order.status] as TranslationKey, locale)}
                    </StatusPill>
                  </TableCell>
                  <TableCell className="pr-4">
                    <Select
                      value={order.status}
                      onValueChange={(value) =>
                        onStatusChange(order.id, order.patientReference, value as PharmacyOrderStatus)
                      }
                    >
                      <SelectTrigger size="sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOrder.map((status) => (
                          <SelectItem key={status} value={status}>
                            {t(adminPharmacyOrderStatusKey[status] as TranslationKey, locale)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
    </Tabs>
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
