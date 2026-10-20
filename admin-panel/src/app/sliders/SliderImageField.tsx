'use client';

import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { isAllowedImageUrl, IMAGE_URL_ERROR } from '@/lib/image-url';
import { validateImageFile, type AdminSlider } from '@/lib/api';
import type { SliderFormData } from '@/lib/sliders';

interface SliderImageFieldProps {
  editing: AdminSlider | null;
  form: SliderFormData;
  setForm: Dispatch<SetStateAction<SliderFormData>>;
  isReplacingImage: boolean;
  setIsReplacingImage: (value: boolean) => void;
}

type Patch = Partial<SliderFormData>;

function MethodRadio({ id, label, checked, onSelect }: { id: string; label: string; checked: boolean; onSelect: () => void }) {
  return (
    <div className="flex items-center space-x-2">
      <input type="radio" id={id} name="image-method" checked={checked} onChange={onSelect} />
      <Label htmlFor={id} className="text-sm">{label}</Label>
    </div>
  );
}

/** Existing inline image while editing: thumbnail + Replace. */
function CurrentImage({ src, onReplace }: { src: string; onReplace: () => void }) {
  return (
    <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <Image src={src} alt="Current slider image" width={64} height={64} className="object-cover rounded border" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">Current Image</p>
          <p className="text-xs text-gray-500">Click replace to upload a new image</p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={onReplace}>
          Replace
        </Button>
      </div>
    </div>
  );
}

function UrlInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1">
      <Input
        id="image"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://res.cloudinary.com/… or /images/…"
      />
      {!isAllowedImageUrl(value) && <p className="text-xs text-red-600">{IMAGE_URL_ERROR}</p>}
    </div>
  );
}

type FileInputProps = { onFile: (file: File | null) => void; isReplacing: boolean; onFileChosen: () => void };

function FileInput({ onFile, isReplacing, onFileChosen }: FileInputProps) {
  const { addToast } = useToast();
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    const problem = file ? validateImageFile(file) : null;
    if (file && problem) {
      addToast({ type: 'error', title: 'Invalid image', description: problem });
      e.target.value = '';
      onFile(null);
      return;
    }
    onFile(file);
    if (isReplacing) onFileChosen(); // a new file was chosen
  };
  return <Input id="image-file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={handleChange} />;
}

function SelectedFile({ file }: { file: File }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>Selected: {file.name}</span>
      <span className="text-xs">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
    </div>
  );
}

export function SliderImageField({ editing, form, setForm, isReplacingImage, setIsReplacingImage }: SliderImageFieldProps) {
  const isInlineImage = form.image.startsWith('data:'); // legacy sliders stored the picture inline
  const update = (change: Patch) => setForm((prev) => ({ ...prev, ...change }));
  // File input unless an inline image is being kept (editing) and Replace was not pressed.
  const showFileInput = !editing || !isInlineImage || isReplacingImage;

  return (
    <div>
      <Label htmlFor="image">Image</Label>
      <div className="space-y-3">
        <div className="flex gap-4">
          <MethodRadio id="image-url" label="URL" checked={form.imageUploadMethod === 'url'} onSelect={() => update({ imageUploadMethod: 'url', imageFile: null })} />
          <MethodRadio id="image-upload" label="Upload" checked={form.imageUploadMethod === 'upload'} onSelect={() => update({ imageUploadMethod: 'upload', image: '' })} />
          {editing && form.image && (
            <div className="text-xs text-muted-foreground ml-2">{isInlineImage ? '(Uploaded)' : '(URL)'}</div>
          )}
        </div>

        {editing && isInlineImage && (
          <CurrentImage
            src={form.image}
            onReplace={() => {
              update({ imageUploadMethod: 'upload', imageFile: null });
              setIsReplacingImage(true);
            }}
          />
        )}

        {form.imageUploadMethod === 'url' ? (
          <UrlInput value={form.image} onChange={(image) => update({ image })} />
        ) : (
          <div className="space-y-2">
            {showFileInput && (
              <FileInput
                onFile={(imageFile) => update({ imageFile })}
                isReplacing={isReplacingImage}
                onFileChosen={() => setIsReplacingImage(false)}
              />
            )}
            {form.imageFile && <SelectedFile file={form.imageFile} />}
            <p className="text-xs text-muted-foreground">
              JPEG, PNG, WebP or AVIF, up to 5 MB. Uploaded to Cloudinary when you save.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
