'use client';

import type { Dispatch, FormEvent, SetStateAction } from 'react';
import Image from 'next/image';
import { Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { isAllowedImageUrl, IMAGE_URL_ERROR } from '@/lib/image-url';
import { validateImageFile, type AdminSlider } from '@/lib/api';
import {
  patchConfigSection, type OverlayPosition, type SliderConfig, type SliderConfigSection, type SliderFormData,
} from '@/lib/sliders';

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

interface ConfigSelectProps<T extends string> {
  id: string;
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

/** A labelled select; the label is wired to the trigger so it is announced and clickable. */
function ConfigSelect<T extends string>({ id, label, value, options, onChange }: ConfigSelectProps<T>) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

const POSITION_OPTIONS: { value: OverlayPosition; label: string }[] = [
  { value: 'center', label: 'Center' },
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-right', label: 'Bottom Right' },
  { value: 'top-center', label: 'Top Center' },
  { value: 'bottom-center', label: 'Bottom Center' },
];

export function SliderForm({
  open, onOpenChange, editing, form, setForm, isReplacingImage, setIsReplacingImage, isSubmitting, onSubmit, onPreview,
}: SliderFormProps) {
  const { addToast } = useToast();
  const { config } = form;
  const isInlineImage = form.image.startsWith('data:'); // legacy sliders stored the picture inline

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
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={form.title} onChange={(e) => setField('title', e.target.value)} placeholder="Main title text" />
            </div>
            <div>
              <Label htmlFor="eyebrow">Eyebrow</Label>
              <Input id="eyebrow" value={form.eyebrow} onChange={(e) => setField('eyebrow', e.target.value)} placeholder="Small text above title" />
            </div>
          </div>

          <div>
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input id="subtitle" value={form.subtitle} onChange={(e) => setField('subtitle', e.target.value)} placeholder="Subtitle text" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="image">Image</Label>
              <div className="space-y-3">
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="image-url"
                      name="image-method"
                      checked={form.imageUploadMethod === 'url'}
                      onChange={() => setForm((prev) => ({ ...prev, imageUploadMethod: 'url', imageFile: null }))}
                    />
                    <Label htmlFor="image-url" className="text-sm">URL</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="image-upload"
                      name="image-method"
                      checked={form.imageUploadMethod === 'upload'}
                      onChange={() => setForm((prev) => ({ ...prev, imageUploadMethod: 'upload', image: '' }))}
                    />
                    <Label htmlFor="image-upload" className="text-sm">Upload</Label>
                  </div>
                  {editing && form.image && (
                    <div className="text-xs text-muted-foreground ml-2">{isInlineImage ? '(Uploaded)' : '(URL)'}</div>
                  )}
                </div>

                {/* Existing inline image while editing: thumbnail + Replace */}
                {editing && isInlineImage && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <Image src={form.image} alt="Current slider image" width={64} height={64} className="object-cover rounded border" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Current Image</p>
                        <p className="text-xs text-gray-500">Click replace to upload a new image</p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setForm((prev) => ({ ...prev, imageUploadMethod: 'upload', imageFile: null }));
                          setIsReplacingImage(true);
                        }}
                      >
                        Replace
                      </Button>
                    </div>
                  </div>
                )}

                {form.imageUploadMethod === 'url' ? (
                  <div className="space-y-1">
                    <Input
                      id="image"
                      value={form.image}
                      onChange={(e) => setField('image', e.target.value)}
                      placeholder="https://res.cloudinary.com/… or /images/…"
                    />
                    {!isAllowedImageUrl(form.image) && <p className="text-xs text-red-600">{IMAGE_URL_ERROR}</p>}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* File input unless an inline image is being kept (editing) and Replace was not pressed */}
                    {(!editing || !form.image || !isInlineImage || isReplacingImage) && (
                      <Input
                        id="image-file"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          const problem = file ? validateImageFile(file) : null;
                          if (file && problem) {
                            addToast({ type: 'error', title: 'Invalid image', description: problem });
                            e.target.value = '';
                            setField('imageFile', null);
                            return;
                          }
                          setField('imageFile', file);
                          if (isReplacingImage) setIsReplacingImage(false); // a new file was chosen
                        }}
                      />
                    )}
                    {form.imageFile && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Selected: {form.imageFile.name}</span>
                        <span className="text-xs">({(form.imageFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      JPEG, PNG, WebP or AVIF, up to 5 MB. Uploaded to Cloudinary when you save.
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="alt">Alt Text</Label>
              <Input id="alt" value={form.alt} onChange={(e) => setField('alt', e.target.value)} placeholder="Image alt text" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="href">Link URL</Label>
              <Input id="href" value={form.href} onChange={(e) => setField('href', e.target.value)} placeholder="https://example.com/page" />
            </div>
            <div>
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input
                id="sortOrder"
                type="number"
                value={form.sortOrder}
                onChange={(e) => setField('sortOrder', e.target.value)}
                placeholder="0"
                min="0"
                disabled={!editing}
              />
              {!editing && (
                <p className="text-sm text-muted-foreground mt-1">Sort order will be auto-assigned when creating a new slider</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-base font-semibold">Configuration</Label>

            <div className="space-y-3 p-4 border rounded-lg">
              <Label className="text-sm font-medium">Overlay Settings</Label>
              <div className="grid grid-cols-2 gap-4">
                <ConfigSelect
                  id="overlay-position"
                  label="Position"
                  value={config.overlay?.position || 'center'}
                  options={POSITION_OPTIONS}
                  onChange={(position) => patch('overlay', { position })}
                />
                <ConfigSelect
                  id="overlay-textAlign"
                  label="Text Alignment"
                  value={config.overlay?.textAlign || 'center'}
                  options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]}
                  onChange={(textAlign) => patch('overlay', { textAlign })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="overlay-textColor">Text Color</Label>
                  <Input
                    id="overlay-textColor"
                    type="color"
                    value={config.overlay?.textColor || '#ffffff'}
                    onChange={(e) => patch('overlay', { textColor: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="overlay-backgroundColor">Background Color</Label>
                  <Input
                    id="overlay-backgroundColor"
                    type="color"
                    value={config.overlay?.backgroundColor || '#000000'}
                    onChange={(e) => patch('overlay', { backgroundColor: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="overlay-backgroundOpacity">Background Opacity (%)</Label>
                <Input
                  id="overlay-backgroundOpacity"
                  type="number"
                  min="0"
                  max="100"
                  value={config.overlay?.backgroundOpacity ?? 50}
                  onChange={(e) => patch('overlay', { backgroundOpacity: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-3 p-4 border rounded-lg">
              <Label className="text-sm font-medium">Button Settings</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="button-show"
                  checked={config.button?.show || false}
                  onCheckedChange={(show) => patch('button', { show })}
                />
                <Label htmlFor="button-show">Show Button</Label>
              </div>
              {config.button?.show && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="button-text">Button Text</Label>
                      <Input
                        id="button-text"
                        value={config.button?.text || ''}
                        onChange={(e) => patch('button', { text: e.target.value })}
                        placeholder="Learn More"
                      />
                    </div>
                    <ConfigSelect
                      id="button-style"
                      label="Button Style"
                      value={config.button?.style || 'primary'}
                      options={[{ value: 'primary', label: 'Primary' }, { value: 'secondary', label: 'Secondary' }, { value: 'outline', label: 'Outline' }]}
                      onChange={(style) => patch('button', { style })}
                    />
                  </div>
                  <ConfigSelect
                    id="button-position"
                    label="Button Position"
                    value={config.button?.position || 'overlay'}
                    options={[{ value: 'overlay', label: 'Overlay' }, { value: 'below', label: 'Below Content' }]}
                    onChange={(position) => patch('button', { position })}
                  />
                </>
              )}
            </div>

            <div className="space-y-3 p-4 border rounded-lg">
              <Label className="text-sm font-medium">Routing Settings</Label>
              <ConfigSelect
                id="routing-behavior"
                label="Routing Behavior"
                value={config.routing?.behavior || 'complete-image-and-button'}
                options={[
                  { value: 'complete-image-and-button', label: 'Complete Image & Button' },
                  { value: 'button-only', label: 'Button Only' },
                ]}
                onChange={(behavior) => patch('routing', { behavior })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Choose whether the entire slider image/content and button should be clickable or only the button.
              </p>
            </div>

            <div className="space-y-3 p-4 border rounded-lg">
              <Label className="text-sm font-medium">Layout Settings</Label>
              <div className="grid grid-cols-2 gap-4">
                <ConfigSelect
                  id="layout-contentWidth"
                  label="Content Width"
                  value={config.layout?.contentWidth || 'container'}
                  options={[{ value: 'full', label: 'Full Width' }, { value: 'container', label: 'Container' }, { value: 'narrow', label: 'Narrow' }]}
                  onChange={(contentWidth) => patch('layout', { contentWidth })}
                />
                <ConfigSelect
                  id="layout-verticalAlign"
                  label="Vertical Alignment"
                  value={config.layout?.verticalAlign || 'center'}
                  options={[{ value: 'top', label: 'Top' }, { value: 'center', label: 'Center' }, { value: 'bottom', label: 'Bottom' }]}
                  onChange={(verticalAlign) => patch('layout', { verticalAlign })}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="active" checked={form.active} onCheckedChange={(checked) => setField('active', checked)} />
            <Label htmlFor="active">Active (visible on homepage)</Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="button" variant="outline" onClick={onPreview}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button type="submit" disabled={isSubmitting || (form.imageUploadMethod === 'url' && !isAllowedImageUrl(form.image))}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? 'Update' : 'Create'} Slider
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
