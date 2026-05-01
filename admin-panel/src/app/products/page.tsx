"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { adminApi, AdminProduct, AdminCategory, ApiError, AdminProductType, AdminSaleMode } from "@/lib/api";

const PRODUCT_TYPES: { value: AdminProductType; label: string }[] = [
  { value: "CUT_FLOWER", label: "Cut flower" },
  { value: "PLANT", label: "Plant" },
  { value: "BOUQUET", label: "Bouquet" },
  { value: "ARRANGEMENT", label: "Arrangement" },
  { value: "HAMPER", label: "Hamper" },
];

const UNIT_OPTIONS = [
  { value: "piece", label: "Piece" },
  { value: "stem", label: "Stem" },
  { value: "bunch", label: "Bunch" },
  { value: "box", label: "Box" },
  { value: "kg", label: "Kg" },
];

interface ProductForm {
  name: string;
  slug: string;
  description: string;
  price: string;
  image: string;
  stock: string;
  categoryId: string;
  featured: boolean;
  active: boolean;
  productType: AdminProductType;
  saleMode: AdminSaleMode;
  gstRate: string;
  unit: string;
  minOrderQty: string;
}

const emptyForm: ProductForm = {
  name: "",
  slug: "",
  description: "",
  price: "",
  image: "",
  stock: "0",
  categoryId: "",
  featured: false,
  active: true,
  productType: "CUT_FLOWER",
  saleMode: "PURCHASE",
  gstRate: "0",
  unit: "piece",
  minOrderQty: "1",
};

function slugify(input: string): string {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function formatINR(amount: number): string {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `₹${amount.toFixed(0)}`;
  }
}

export default function ProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const { addToast } = useToast();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [products, cats] = await Promise.all([
        adminApi.listProducts({ active: undefined, take: 200 }),
        adminApi.listCategories(),
      ]);
      setProducts(products.items);
      setCategories(cats);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to load products";
      addToast({ type: "error", title: "Error", description: message });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const reset = () => {
    setForm(emptyForm);
    setEditing(null);
  };

  const openCreate = () => {
    reset();
    setIsDialogOpen(true);
  };

  const openEdit = (p: AdminProduct) => {
    setEditing(p);
    setForm({
      name: p.name,
      slug: p.slug,
      description: p.description ?? "",
      price: p.price.toString(),
      image: p.image ?? "",
      stock: p.stock.toString(),
      categoryId: p.categoryId?.toString() ?? "",
      featured: p.featured,
      active: p.active,
      productType: p.productType ?? "CUT_FLOWER",
      saleMode: p.saleMode ?? "PURCHASE",
      gstRate: (p.gstRate ?? 0).toString(),
      unit: p.unit ?? "piece",
      minOrderQty: (p.minOrderQty ?? 1).toString(),
    });
    setIsDialogOpen(true);
  };

  const handleNameChange = (name: string) => {
    setForm((f) => ({
      ...f,
      name,
      slug: editing ? f.slug : slugify(name),
    }));
  };

  const handleImageFile = async (file: File | null) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      addToast({ type: "error", title: "File too large", description: "Please select an image under 2MB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === "string") {
        setForm((f) => ({ ...f, image: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const isEnquiry = form.saleMode === "ENQUIRY";
      const priceNum = parseFloat(form.price);
      if (!isEnquiry && (isNaN(priceNum) || priceNum < 0)) {
        throw new Error("Please enter a valid price for purchase products.");
      }
      const gstNum = parseFloat(form.gstRate || "0");
      if (isNaN(gstNum) || gstNum < 0) {
        throw new Error("Please enter a valid GST rate (0 or positive).");
      }
      const minOrderNum = parseInt(form.minOrderQty || "1", 10);
      const stockNum = parseInt(form.stock || "0", 10);
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name),
        description: form.description.trim() || undefined,
        price: isEnquiry ? (isNaN(priceNum) ? 0 : priceNum) : priceNum,
        image: form.image || undefined,
        stock: isNaN(stockNum) ? 0 : Math.max(0, stockNum),
        featured: form.featured,
        active: form.active,
        categoryId: form.categoryId ? parseInt(form.categoryId, 10) : null,
        productType: form.productType,
        saleMode: form.saleMode,
        gstRate: gstNum,
        unit: form.unit,
        minOrderQty: isNaN(minOrderNum) || minOrderNum < 1 ? 1 : minOrderNum,
      };
      if (editing) {
        await adminApi.updateProduct(editing.id, payload);
        addToast({ type: "success", title: "Updated", description: `${payload.name} updated.` });
      } else {
        await adminApi.createProduct(payload);
        addToast({ type: "success", title: "Created", description: `${payload.name} added.` });
      }
      setIsDialogOpen(false);
      reset();
      fetchAll();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Save failed";
      addToast({ type: "error", title: "Error", description: message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(id);
    try {
      await adminApi.deleteProduct(id);
      addToast({ type: "success", title: "Deleted", description: "Product removed." });
      fetchAll();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Delete failed";
      addToast({ type: "error", title: "Error", description: message });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage your flower products</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit product" : "New product"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" required value={form.name} onChange={(e) => handleNameChange(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input id="slug" required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="productType">Product type</Label>
                  <select
                    id="productType"
                    value={form.productType}
                    onChange={(e) => setForm({ ...form, productType: e.target.value as AdminProductType })}
                    className="w-full p-2 border rounded mt-1"
                  >
                    {PRODUCT_TYPES.map((pt) => (
                      <option key={pt.value} value={pt.value}>{pt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="saleMode">Sale mode</Label>
                  <select
                    id="saleMode"
                    value={form.saleMode}
                    onChange={(e) => setForm({ ...form, saleMode: e.target.value as AdminSaleMode })}
                    className="w-full p-2 border rounded mt-1"
                  >
                    <option value="PURCHASE">Purchase (Add to cart)</option>
                    <option value="ENQUIRY">Enquiry only (custom quote)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price (₹) {form.saleMode === "ENQUIRY" ? <span className="text-xs text-muted-foreground">(optional, indicative)</span> : null}</Label>
                  <Input id="price" type="number" step="0.01" min="0" required={form.saleMode === "PURCHASE"} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="stock">Stock {form.saleMode === "ENQUIRY" ? <span className="text-xs text-muted-foreground">(N/A for enquiry)</span> : null}</Label>
                  <Input id="stock" type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="gstRate">GST rate (%)</Label>
                  <Input id="gstRate" type="number" step="0.1" min="0" value={form.gstRate} onChange={(e) => setForm({ ...form, gstRate: e.target.value })} />
                  <p className="text-xs text-muted-foreground mt-1">0 for raw cut flowers, 5 for bouquets/arrangements</p>
                </div>
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <select
                    id="unit"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full p-2 border rounded mt-1"
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="minOrderQty">Min. order qty</Label>
                  <Input id="minOrderQty" type="number" min="1" value={form.minOrderQty} onChange={(e) => setForm({ ...form, minOrderQty: e.target.value })} />
                </div>
              </div>
              <div>
                <Label htmlFor="categoryId">Category</Label>
                <select
                  id="categoryId"
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full p-2 border rounded mt-1"
                >
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Product image</Label>
                <div className="space-y-2 mt-1">
                  <Input
                    placeholder="Image URL or paste a data: URL"
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                  />
                  <Input type="file" accept="image/*" onChange={(e) => handleImageFile(e.target.files?.[0] || null)} />
                  {form.image && (
                    <div className="w-32 h-32 rounded border overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url(${form.image})` }} />
                  )}
                  <p className="text-xs text-muted-foreground">Images under 2MB are stored inline as base64.</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center space-x-2">
                  <Switch id="featured" checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
                  <Label htmlFor="featured">Featured</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="active" checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
                  <Label htmlFor="active">Active (visible to customers)</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editing ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All products ({products.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <p className="text-muted-foreground text-sm">No products yet. Click &quot;Add Product&quot; to create one.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {p.image ? (
                        <div className="w-12 h-12 rounded bg-cover bg-center" style={{ backgroundImage: `url(${p.image})` }} />
                      ) : (
                        <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center">🌸</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.slug}</div>
                    </TableCell>
                    <TableCell>{p.category?.name ?? "—"}</TableCell>
                    <TableCell>{formatINR(p.price)}</TableCell>
                    <TableCell>{p.stock}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-xs">
                        <span className={p.active ? "text-green-700" : "text-red-600"}>
                          {p.active ? "Active" : "Inactive"}
                        </span>
                        {p.featured && <span className="text-amber-700">Featured</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" disabled={deleting === p.id}>
                              {deleting === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete &ldquo;{p.name}&rdquo;?</AlertDialogTitle>
                              <AlertDialogDescription>
                                If this product has past orders it will be deactivated rather than deleted.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(p.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
