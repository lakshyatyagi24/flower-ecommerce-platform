import type { ComponentProps } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isAllowedImageUrl, IMAGE_URL_ERROR } from '@/lib/image-url';
import type { AdminCategory, AdminProductType, AdminSaleMode } from '@/lib/api';
import { FormState, PRODUCT_TYPES, SALE_MODES } from '../category-form';

type SetField = <K extends keyof FormState>(key: K, value: FormState[K]) => void;
type FieldsProps = { form: FormState; setField: SetField; disabled: boolean };

type TextFieldProps = Omit<ComponentProps<typeof Input>, 'onChange'> & {
  id: string;
  label: string;
  onValue: (value: string) => void;
};

function TextField({ id, label, onValue, ...inputProps }: TextFieldProps) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} onChange={(e) => onValue(e.target.value)} {...inputProps} />
    </div>
  );
}

type SelectFieldProps = {
  id: string;
  label: string;
  value: string;
  disabled: boolean;
  onValue: (value: string) => void;
  options: { value: string; label: string }[];
  noneLabel: string;
};

function SelectField({ id, label, value, disabled, onValue, options, noneLabel }: SelectFieldProps) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <select id={id} value={value} onChange={(e) => onValue(e.target.value)} className="w-full p-2 border rounded" disabled={disabled}>
        <option value="">{noneLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

const typeOptions = PRODUCT_TYPES.map((t) => ({ value: t, label: t.replace('_', ' ').toLowerCase() }));
const modeOptions = SALE_MODES.map((m) => ({ value: m, label: m }));

export function NameSlugFields({ form, setField, disabled, onNameChange }: FieldsProps & { onNameChange: (name: string) => void }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <TextField id="name" label="Name" value={form.name} onValue={onNameChange} required disabled={disabled} />
        <TextField id="slug" label="Slug" value={form.slug} onValue={(v) => setField('slug', v)} required disabled={disabled} />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          rows={2}
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
          disabled={disabled}
          className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Short copy used on category landing pages and SEO meta."
        />
      </div>
      <div>
        <TextField id="image" label="Image URL" value={form.image} onValue={(v) => setField('image', v)} disabled={disabled} placeholder="https://…" />
        {!isAllowedImageUrl(form.image) && <p className="text-xs text-red-600">{IMAGE_URL_ERROR}</p>}
      </div>
    </>
  );
}

export function ParentSortFields({ form, setField, disabled, parents }: FieldsProps & { parents: AdminCategory[] }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <SelectField
        id="parentId"
        label="Parent category"
        value={form.parentId}
        disabled={disabled}
        onValue={(v) => setField('parentId', v)}
        options={parents.map((c) => ({ value: c.id.toString(), label: c.name }))}
        noneLabel="— Top level —"
      />
      <TextField id="sortOrder" label="Sort order" type="number" value={form.sortOrder} onValue={(v) => setField('sortOrder', v)} placeholder="0" disabled={disabled} />
    </div>
  );
}

export function DefaultsFields({ form, setField, disabled }: FieldsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <SelectField
        id="productType"
        label="Product type"
        value={form.productType}
        disabled={disabled}
        onValue={(v) => setField('productType', v as AdminProductType | '')}
        options={typeOptions}
        noneLabel="— None —"
      />
      <SelectField
        id="defaultSaleMode"
        label="Default sale mode"
        value={form.defaultSaleMode}
        disabled={disabled}
        onValue={(v) => setField('defaultSaleMode', v as AdminSaleMode | '')}
        options={modeOptions}
        noneLabel="— None —"
      />
      <TextField
        id="defaultGstRate"
        label="Default GST (%)"
        type="number"
        min="0"
        step="0.5"
        value={form.defaultGstRate}
        onValue={(v) => setField('defaultGstRate', v)}
        disabled={disabled}
        placeholder="0"
      />
    </div>
  );
}
