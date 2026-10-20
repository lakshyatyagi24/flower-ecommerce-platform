import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { AdminCategory } from "@/lib/api";
import { isImageInvalid } from "../product-form";
import type { ProductFormState } from "../useProductForm";
import { CategoryField, NameSlugFields, PricingFields, TypeFields } from "./ProductFormFields";
import { ProductImageField } from "./ProductImageField";
import { ProductTagsField } from "./ProductTagsField";

function FlagSwitches({ state }: { state: ProductFormState }) {
  const { form, setField } = state;
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex items-center space-x-2">
        <Switch id="featured" checked={form.featured} onCheckedChange={(v) => setField("featured", v)} />
        <Label htmlFor="featured">Featured</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch id="active" checked={form.active} onCheckedChange={(v) => setField("active", v)} />
        <Label htmlFor="active">Active (visible to customers)</Label>
      </div>
    </div>
  );
}

function FormActions({ state }: { state: ProductFormState }) {
  const { submitting, uploading, editing, form } = state;
  return (
    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" onClick={() => state.setIsDialogOpen(false)}>
        Cancel
      </Button>
      <Button type="submit" disabled={submitting || uploading || isImageInvalid(form.image)}>
        {(submitting || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {uploading ? "Uploading…" : editing ? "Update" : "Create"}
      </Button>
    </div>
  );
}

export function ProductFormDialog({ state, categories }: { state: ProductFormState; categories: AdminCategory[] }) {
  const { form, setField } = state;
  return (
    <Dialog open={state.isDialogOpen} onOpenChange={state.setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button onClick={state.openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{state.editing ? "Edit product" : "New product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={state.handleSubmit} className="space-y-4">
          <NameSlugFields form={form} setField={setField} onNameChange={state.handleNameChange} />
          <TypeFields form={form} setField={setField} />
          <PricingFields form={form} setField={setField} />
          <ProductTagsField value={form.tags} onChange={(v) => setField("tags", v)} />
          <CategoryField form={form} setField={setField} categories={categories} />
          <ProductImageField
            image={form.image}
            uploading={state.uploading}
            onImageChange={(v) => setField("image", v)}
            onFile={state.handleImageFile}
          />
          <FlagSwitches state={state} />
          <FormActions state={state} />
        </form>
      </DialogContent>
    </Dialog>
  );
}
