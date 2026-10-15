'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/toast';
import { adminApi, ApiError, uploadImage, validateImageFile, type AdminSlider } from '@/lib/api';
import { blankSliderForm, buildSliderPayload, isSliderEmpty, sliderToForm, type SliderFormData } from '@/lib/sliders';
import { SliderForm } from './SliderForm';
import { SliderList } from './SliderList';
import { SliderPreview } from './SliderPreview';

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export default function SlidersPage() {
  const [sliders, setSliders] = useState<AdminSlider[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlider, setEditingSlider] = useState<AdminSlider | null>(null);
  const [formData, setFormData] = useState<SliderFormData>(blankSliderForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [includeInactive, setIncludeInactive] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  // Preview of a list row; null means "preview the form being edited".
  const [previewData, setPreviewData] = useState<SliderFormData | null>(null);
  const [isReplacingImage, setIsReplacingImage] = useState(false);
  const { addToast } = useToast();

  const toastError = useCallback(
    (error: unknown, fallback: string) => {
      // An expired session is announced once by the auth provider ("Session expired"), not here as well.
      if (error instanceof ApiError && error.status === 401) return;
      addToast({ type: 'error', title: 'Error', description: messageOf(error, fallback) });
    },
    [addToast],
  );

  const fetchSliders = useCallback(async () => {
    try {
      setSliders(await adminApi.listSliders(includeInactive));
    } catch (error) {
      toastError(error, 'Failed to fetch sliders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [includeInactive, toastError]);

  useEffect(() => {
    fetchSliders();
  }, [fetchSliders]);

  const resetForm = () => {
    setFormData(blankSliderForm());
    setEditingSlider(null);
    setIsReplacingImage(false);
  };

  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSliderEmpty(formData)) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        description: 'Please provide at least a title, eyebrow, subtitle, or image for the slider.',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      let imageUrl = formData.image;
      if (formData.imageUploadMethod === 'upload' && formData.imageFile) {
        // Pre-check type/size, then upload to Cloudinary (the saved value is an https URL, never base64)
        const problem = validateImageFile(formData.imageFile);
        if (problem) {
          addToast({ type: 'error', title: 'Invalid image', description: problem });
          return;
        }
        imageUrl = (await uploadImage(formData.imageFile, 'sliders')).url;
      }

      const payload = buildSliderPayload(formData, imageUrl, !!editingSlider);
      if (editingSlider) await adminApi.updateSlider(editingSlider.id, payload);
      else await adminApi.createSlider(payload);

      addToast({
        type: 'success',
        title: 'Success',
        description: `Slider ${editingSlider ? 'updated' : 'created'} successfully.`,
      });
      setIsDialogOpen(false);
      resetForm();
      fetchSliders();
    } catch (error) {
      toastError(error, 'Failed to save slider. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (slider: AdminSlider) => {
    setFormData(sliderToForm(slider));
    setEditingSlider(slider);
    setIsDialogOpen(true);
    setIsReplacingImage(false);
  };

  const handleDuplicate = (slider: AdminSlider) => {
    setEditingSlider(null);
    setFormData(sliderToForm(slider, { sortOrder: '', active: false })); // duplicates start inactive
    setIsDialogOpen(true);
    setIsReplacingImage(false);
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await adminApi.deleteSlider(id);
      addToast({ type: 'success', title: 'Success', description: 'Slider deleted successfully.' });
      fetchSliders();
    } catch (error) {
      toastError(error, 'Failed to delete slider. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (slider: AdminSlider) => {
    try {
      await adminApi.updateSlider(slider.id, { active: !slider.active });
      addToast({
        type: 'success',
        title: 'Success',
        description: `Slider ${!slider.active ? 'activated' : 'deactivated'} successfully.`,
      });
      fetchSliders();
    } catch (error) {
      toastError(error, 'Failed to update slider. Please try again.');
    }
  };

  const handlePreviewRow = (slider: AdminSlider) => {
    setPreviewData(sliderToForm(slider));
    setIsPreviewOpen(true);
  };

  const handleMoveSlider = async (slider: AdminSlider, direction: 'up' | 'down') => {
    const currentIndex = sliders.findIndex((s) => s.id === slider.id);
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === sliders.length - 1) return;
    const target = sliders[direction === 'up' ? currentIndex - 1 : currentIndex + 1];

    try {
      // Swap sort orders
      await Promise.all([
        adminApi.updateSlider(slider.id, { sortOrder: target.sortOrder }),
        adminApi.updateSlider(target.id, { sortOrder: slider.sortOrder }),
      ]);
      addToast({ type: 'success', title: 'Success', description: 'Slider order updated successfully.' });
    } catch (error) {
      toastError(error, 'Failed to update slider order. Please try again.');
    } finally {
      // Always re-read: if only one of the two writes landed the list must show the real order.
      fetchSliders();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sliders Management</h1>
          <p className="text-muted-foreground">Manage homepage sliders and their configurations</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch id="include-inactive" checked={includeInactive} onCheckedChange={setIncludeInactive} />
            <Label htmlFor="include-inactive">Show inactive sliders</Label>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Slider
          </Button>
        </div>
      </div>

      <SliderForm
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editing={editingSlider}
        form={formData}
        setForm={setFormData}
        isReplacingImage={isReplacingImage}
        setIsReplacingImage={setIsReplacingImage}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        onPreview={() => {
          setPreviewData(null);
          setIsPreviewOpen(true);
        }}
      />

      <SliderPreview
        open={isPreviewOpen}
        onOpenChange={(open) => {
          setIsPreviewOpen(open);
          if (!open) setPreviewData(null);
        }}
        data={previewData ?? formData}
      />

      <SliderList
        sliders={sliders}
        deletingId={deletingId}
        onPreview={handlePreviewRow}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
        onMove={handleMoveSlider}
      />
    </div>
  );
}
