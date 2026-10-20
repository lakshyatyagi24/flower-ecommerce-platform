import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { isAllowedImageUrl } from '@/lib/image-url';
import type { AdminCategory } from '@/lib/api';
import type { CategoryFormState } from '../useCategoryForm';
import { DefaultsFields, NameSlugFields, ParentSortFields } from './CategoryFormFields';

type CategoryFormDialogProps = { state: CategoryFormState; categoriesFlat: AdminCategory[] };

function FormActions({ state }: { state: CategoryFormState }) {
  const { isSubmitting, editingCategory, formData } = state;
  return (
    <div className="flex justify-end gap-2 pt-2">
      <Button type="button" variant="outline" onClick={() => state.setIsDialogOpen(false)} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button type="submit" disabled={isSubmitting || !isAllowedImageUrl(formData.image)}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {editingCategory ? 'Update' : 'Create'}
      </Button>
    </div>
  );
}

export function CategoryFormDialog({ state, categoriesFlat }: CategoryFormDialogProps) {
  const { formData: form, setField, isSubmitting: disabled } = state;
  return (
    <Dialog open={state.isDialogOpen} onOpenChange={state.setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button onClick={state.openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{state.editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={state.handleSubmit} className="space-y-4 mt-4">
          <NameSlugFields form={form} setField={setField} disabled={disabled} onNameChange={state.handleNameChange} />
          <ParentSortFields form={form} setField={setField} disabled={disabled} parents={categoriesFlat} />
          <DefaultsFields form={form} setField={setField} disabled={disabled} />
          <label className="flex items-center gap-2 mt-2">
            <input type="checkbox" checked={form.active} onChange={(e) => setField('active', e.target.checked)} disabled={disabled} />
            <span className="text-sm">Active (visible on storefront)</span>
          </label>
          <FormActions state={state} />
        </form>
      </DialogContent>
    </Dialog>
  );
}
