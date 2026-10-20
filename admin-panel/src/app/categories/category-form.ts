import type { AdminCategory, AdminCategoryInput, AdminProductType, AdminSaleMode } from '@/lib/api';

export const PRODUCT_TYPES: AdminProductType[] = ['CUT_FLOWER', 'PLANT', 'BOUQUET', 'ARRANGEMENT', 'HAMPER'];
export const SALE_MODES: AdminSaleMode[] = ['PURCHASE', 'ENQUIRY'];

export type FormState = {
  name: string;
  slug: string;
  image: string;
  description: string;
  parentId: string;
  productType: AdminProductType | '';
  defaultSaleMode: AdminSaleMode | '';
  defaultGstRate: string;
  sortOrder: string;
  active: boolean;
};

export const blankForm = (): FormState => ({
  name: '',
  slug: '',
  image: '',
  description: '',
  parentId: '',
  productType: '',
  defaultSaleMode: '',
  defaultGstRate: '',
  sortOrder: '',
  active: true,
});

const numberToText = (value: number | null | undefined): string => (value !== undefined && value !== null ? String(value) : '');

const textToNumber = (value: string): number | undefined => (value !== '' ? Number(value) : undefined);

export function categoryToForm(category: AdminCategory): FormState {
  return {
    name: category.name,
    slug: category.slug,
    image: category.image || '',
    description: category.description || '',
    parentId: category.parentId?.toString() || '',
    productType: (category.productType as AdminProductType) || '',
    defaultSaleMode: (category.defaultSaleMode as AdminSaleMode) || '',
    defaultGstRate: numberToText(category.defaultGstRate),
    sortOrder: numberToText(category.sortOrder),
    active: category.active !== false,
  };
}

export function formToPayload(form: FormState): AdminCategoryInput {
  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    image: form.image.trim() || null,
    description: form.description.trim() || null,
    parentId: form.parentId ? parseInt(form.parentId, 10) : null,
    productType: form.productType || undefined,
    defaultSaleMode: form.defaultSaleMode || undefined,
    defaultGstRate: textToNumber(form.defaultGstRate),
    sortOrder: textToNumber(form.sortOrder),
    active: form.active,
  };
}

export const generateSlug = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export function flatten(list: AdminCategory[]): AdminCategory[] {
  return list.flatMap((n) => [n, ...flatten(n.children ?? [])]);
}

export type VisibleRow = { category: AdminCategory; level: number };

/** Depth-first rows to render: children only appear under expanded parents. */
export function visibleRows(list: AdminCategory[], expanded: Set<number>, level = 0): VisibleRow[] {
  return list.flatMap((category) => {
    const children = category.children ?? [];
    const open = children.length > 0 && expanded.has(category.id);
    return [{ category, level }, ...(open ? visibleRows(children, expanded, level + 1) : [])];
  });
}

/** Friendlier hints for the most common backend errors. */
export function describeSaveError(message: string): { title: string; description: string } {
  if (/Unique constraint failed/i.test(message)) {
    return { title: 'Duplicate slug', description: 'A category with this slug already exists. Please choose a different slug.' };
  }
  if (/Maximum 8 main categories/i.test(message)) {
    return { title: 'Limit reached', description: 'You can only have a maximum of 8 main (top-level) categories.' };
  }
  return { title: 'Error', description: message };
}
