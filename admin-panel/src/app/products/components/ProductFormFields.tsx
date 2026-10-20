import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AdminCategory, AdminProductType, AdminSaleMode } from "@/lib/api";
import { PRODUCT_TYPES, UNIT_OPTIONS } from "../constants";
import type { ProductForm } from "../product-form";

export type SetField = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) => void;

type FieldsProps = { form: ProductForm; setField: SetField };

type SelectFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
};

function SelectField({ id, label, value, onChange, children }: SelectFieldProps) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="w-full p-2 border rounded mt-1">
        {children}
      </select>
    </div>
  );
}

function Hint({ text }: { text: string }) {
  return <span className="text-xs text-muted-foreground">{text}</span>;
}

export function NameSlugFields({
  form,
  setField,
  onNameChange,
}: FieldsProps & { onNameChange: (name: string) => void }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" required value={form.name} onChange={(e) => onNameChange(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" required value={form.slug} onChange={(e) => setField("slug", e.target.value)} />
        </div>
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={3} value={form.description} onChange={(e) => setField("description", e.target.value)} />
      </div>
    </>
  );
}

export function TypeFields({ form, setField }: FieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <SelectField id="productType" label="Product type" value={form.productType} onChange={(v) => setField("productType", v as AdminProductType)}>
        {PRODUCT_TYPES.map((pt) => (
          <option key={pt.value} value={pt.value}>{pt.label}</option>
        ))}
      </SelectField>
      <SelectField id="saleMode" label="Sale mode" value={form.saleMode} onChange={(v) => setField("saleMode", v as AdminSaleMode)}>
        <option value="PURCHASE">Purchase (Add to cart)</option>
        <option value="ENQUIRY">Enquiry only (custom quote)</option>
      </SelectField>
    </div>
  );
}

export function PricingFields({ form, setField }: FieldsProps) {
  const isEnquiry = form.saleMode === "ENQUIRY";
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">Price (₹) {isEnquiry ? <Hint text="(optional, indicative)" /> : null}</Label>
          <Input id="price" type="number" step="0.01" min="0" required={!isEnquiry} value={form.price} onChange={(e) => setField("price", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="stock">Stock {isEnquiry ? <Hint text="(N/A for enquiry)" /> : null}</Label>
          <Input id="stock" type="number" min="0" value={form.stock} onChange={(e) => setField("stock", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="gstRate">GST rate (%)</Label>
          <Input id="gstRate" type="number" step="0.1" min="0" value={form.gstRate} onChange={(e) => setField("gstRate", e.target.value)} />
          <p className="text-xs text-muted-foreground mt-1">0 for raw cut flowers, 5 for bouquets/arrangements</p>
        </div>
        <SelectField id="unit" label="Unit" value={form.unit} onChange={(v) => setField("unit", v)}>
          {UNIT_OPTIONS.map((u) => (
            <option key={u.value} value={u.value}>{u.label}</option>
          ))}
        </SelectField>
        <div>
          <Label htmlFor="minOrderQty">Min. order qty</Label>
          <Input id="minOrderQty" type="number" min="1" value={form.minOrderQty} onChange={(e) => setField("minOrderQty", e.target.value)} />
        </div>
      </div>
    </>
  );
}

export function CategoryField({ form, setField, categories }: FieldsProps & { categories: AdminCategory[] }) {
  return (
    <SelectField id="categoryId" label="Category" value={form.categoryId} onChange={(v) => setField("categoryId", v)}>
      <option value="">No category</option>
      {categories.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </SelectField>
  );
}
