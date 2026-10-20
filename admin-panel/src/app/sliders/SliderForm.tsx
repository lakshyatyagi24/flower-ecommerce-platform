'use client';

import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { isAllowedImageUrl } from '@/lib/image-url';
import type { AdminSlider } from '@/lib/api';
import { patchConfigSection, type SliderConfigSection, type SliderConfig, type SliderFormData } from '@/lib/sliders';
import { SliderConfigFields } from './SliderConfigFields';
import { SliderImageField } from './SliderImageField';

interface SliderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The slider being edited, or null when creating / duplicating. */
  editing: AdminSlider | null;
  form: SliderFormData;
  setForm: Dispatch<SetStateAction<SliderFormData>>;
  isReplacingImage: boolean;
  setIsReplacingImage: (value: boolean) => void;
  isSubmitting: boolean;
  onSubmit: (e: FormEvent) => void;
  onPreview: () => void;
}

type TextKey = 'title' | 'eyebrow' | 'subtitle' | 'alt' | 'href';

type TextFieldProps = {
  id: TextKey;
  label: string;
  placeholder: string;
  form: SliderFormData;
  onChange: (key: TextKey, value: string) => void;
};

function TextField({ id, label, placeholder, form, onChange }: TextFieldProps) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={form[id]} onChange={(e) => onChange(id, e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function SortOrderField({ form, editing, onChange }: { form: SliderFormData; editing: boolean; onChange: (value: string) => void }) {
  return (
    <div>
      <Label htmlFor="sortOrder">Sort Order</Label>
      <Input
        id="sortOrder"
        type="number"
        value={form.sortOrder}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        min="0"
        disabled={!editing}
      />
      {!editing && (
        <p className="text-sm text-muted-foreground mt-1">Sort order will be auto-assigned when creating a new slider</p>
      )}
    </div>
  );
}

function FormActions({ props }: { props: SliderFormProps }) {
  const { form, editing, isSubmitting } = props;
  return (
    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)}>Cancel</Button>
      <Button type="button" variant="outline" onClick={props.onPreview}>
        <Eye className="h-4 w-4 mr-2" />
        Preview
      </Button>
      <Button type="submit" disabled={isSubmitting || (form.imageUploadMethod === 'url' && !isAllowedImageUrl(form.image))}>
        {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {editing ? 'Update' : 'Create'} Slider
      </Button>
    </div>
  );
}

export function SliderForm(props: SliderFormProps) {
  const { open, onOpenChange, editing, form, setForm, onSubmit } = props;

  const setField = <K extends keyof SliderFormData>(key: K, value: SliderFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const patch = <K extends SliderConfigSection>(section: K, change: Partial<NonNullable<SliderConfig[K]>>) =>
    setForm((prev) => ({ ...prev, config: patchConfigSection(prev.config, section, change) }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Slider' : 'Add New Slider'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <TextField id="title" label="Title" placeholder="Main title text" form={form} onChange={setField} />
            <TextField id="eyebrow" label="Eyebrow" placeholder="Small text above title" form={form} onChange={setField} />
          </div>
          <TextField id="subtitle" label="Subtitle" placeholder="Subtitle text" form={form} onChange={setField} />

          <div className="grid grid-cols-2 gap-4">
            <SliderImageField
              editing={editing}
              form={form}
              setForm={setForm}
              isReplacingImage={props.isReplacingImage}
              setIsReplacingImage={props.setIsReplacingImage}
            />
            <TextField id="alt" label="Alt Text" placeholder="Image alt text" form={form} onChange={setField} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TextField id="href" label="Link URL" placeholder="https://example.com/page" form={form} onChange={setField} />
            <SortOrderField form={form} editing={!!editing} onChange={(v) => setField('sortOrder', v)} />
          </div>

          <SliderConfigFields config={form.config} patch={patch} />

          <div className="flex items-center space-x-2">
            <Switch id="active" checked={form.active} onCheckedChange={(checked) => setField('active', checked)} />
            <Label htmlFor="active">Active (visible on homepage)</Label>
          </div>

          <FormActions props={props} />
        </form>
      </DialogContent>
    </Dialog>
  );
}
