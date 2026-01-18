'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Loader2, ArrowUp, ArrowDown, Copy, Eye } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface Slider {
  id: number;
  title?: string;
  eyebrow?: string;
  subtitle?: string;
  alt?: string;
  image?: string;
  href?: string;
  config?: Record<string, unknown>;
  sortOrder: number;
  active: boolean;
}

interface SliderConfig {
  overlay?: {
    position?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
    textColor?: string;
    backgroundColor?: string;
    backgroundOpacity?: number;
    textAlign?: 'left' | 'center' | 'right';
  };
  button?: {
    show?: boolean;
    text?: string;
    style?: 'primary' | 'secondary' | 'outline';
    position?: 'overlay' | 'below';
  };
  layout?: {
    contentWidth?: 'full' | 'container' | 'narrow';
    verticalAlign?: 'top' | 'center' | 'bottom';
  };
  routing?: {
    behavior?: 'complete-image-and-button' | 'button-only' | 'whole-image';
  };
}

interface SliderFormData {
  title: string;
  eyebrow: string;
  subtitle: string;
  alt: string;
  image: string;
  imageFile: File | null;
  imageUploadMethod: 'url' | 'upload';
  href: string;
  config: SliderConfig;
  sortOrder: string;
  active: boolean;
}

export default function SlidersPage() {
  const [sliders, setSliders] = useState<Slider[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlider, setEditingSlider] = useState<Slider | null>(null);
  const [formData, setFormData] = useState<SliderFormData>({
    title: '',
    eyebrow: '',
    subtitle: '',
    alt: '',
    image: '',
    imageFile: null,
    imageUploadMethod: 'url',
    href: '',
    config: {
      overlay: {
        position: 'center',
        textColor: '#ffffff',
        backgroundColor: '#000000',
        backgroundOpacity: 50,
        textAlign: 'center',
      },
      button: {
        show: true,
        text: 'Learn More',
        style: 'primary',
        position: 'overlay',
      },
      layout: {
        contentWidth: 'container',
        verticalAlign: 'center',
      },
      routing: {
        behavior: 'complete-image-and-button',
      },
    },
    sortOrder: '',
    active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [includeInactive, setIncludeInactive] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<SliderFormData | null>(null);
  const [isReplacingImage, setIsReplacingImage] = useState(false);
  const { addToast } = useToast();

  // Image compression utility
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = document.createElement('img');

      img.onload = () => {
        // Calculate new dimensions (max 1200px width/height)
        const maxSize = 1200;
        let { width, height } = img;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file); // fallback to original
          }
        }, 'image/jpeg', 0.8); // 80% quality
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const fetchSliders = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:3001/sliders?includeInactive=${includeInactive}`);
      if (!response.ok) {
        throw new Error('Failed to fetch sliders');
      }
      const data = await response.json();
      setSliders(data);
    } catch (error) {
      console.error('Error fetching sliders:', error);
      addToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to fetch sliders. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }, [includeInactive, addToast]);

  useEffect(() => {
    fetchSliders();
  }, [fetchSliders]);

  const resetForm = () => {
    setFormData({
      title: '',
      eyebrow: '',
      subtitle: '',
      alt: '',
      image: '',
      imageFile: null,
      imageUploadMethod: 'url',
      href: '',
      config: {
        overlay: {
          position: 'center',
          textColor: '#ffffff',
          backgroundColor: '#000000',
          backgroundOpacity: 50,
          textAlign: 'center',
        },
        button: {
          show: true,
          text: 'Learn More',
          style: 'primary',
          position: 'overlay',
        },
        layout: {
          contentWidth: 'container',
          verticalAlign: 'center',
        },
        routing: {
          behavior: 'complete-image-and-button',
        },
      },
      sortOrder: '',
      active: true,
    });
    setEditingSlider(null);
    setIsReplacingImage(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Basic validation
      if (!formData.title && !formData.eyebrow && !formData.subtitle && 
          ((formData.imageUploadMethod === 'url' && !formData.image) || 
           (formData.imageUploadMethod === 'upload' && !formData.imageFile))) {
        addToast({
          type: 'error',
          title: 'Validation Error',
          description: 'Please provide at least a title, eyebrow, subtitle, or image for the slider.',
        });
        setIsSubmitting(false);
        return;
      }

      let configJson = {};
      if (formData.config && Object.keys(formData.config).length > 0) {
        // Clean up empty config sections
        const cleanedConfig: Record<string, unknown> = {};
        
        if (formData.config.overlay && Object.values(formData.config.overlay).some(v => v !== undefined)) {
          cleanedConfig.overlay = formData.config.overlay;
        }
        
        if (formData.config.button && Object.values(formData.config.button).some(v => v !== undefined)) {
          cleanedConfig.button = formData.config.button;
        }
        
        if (formData.config.layout && Object.values(formData.config.layout).some(v => v !== undefined)) {
          cleanedConfig.layout = formData.config.layout;
        }
        
        if (formData.config.routing && Object.values(formData.config.routing).some(v => v !== undefined)) {
          cleanedConfig.routing = formData.config.routing;
        }
        
        // If cleanedConfig has any properties, use it; otherwise, check if we have routing to include
        if (Object.keys(cleanedConfig).length > 0) {
          configJson = cleanedConfig;
        } else if (formData.config.routing && Object.values(formData.config.routing).some(v => v !== undefined)) {
          configJson = { routing: formData.config.routing };
        }
      }

      // Handle image upload or URL
      let finalImageUrl = formData.image;
      if (formData.imageUploadMethod === 'upload' && formData.imageFile) {
        // Check file size before processing (limit to 2MB)
        if (formData.imageFile.size > 2 * 1024 * 1024) {
          addToast({
            type: 'error',
            title: 'File Too Large',
            description: 'Please select an image smaller than 2MB.',
          });
          setIsSubmitting(false);
          return;
        }

        // Compress and convert to base64
        const compressedFile = await compressImage(formData.imageFile);
        finalImageUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(compressedFile);
        });
      }

      const payload = {
        title: formData.title || undefined,
        eyebrow: formData.eyebrow || undefined,
        subtitle: formData.subtitle || undefined,
        alt: formData.alt || undefined,
        image: finalImageUrl || undefined,
        href: formData.href || undefined,
        config: configJson,
        sortOrder: editingSlider ? (formData.sortOrder ? parseInt(formData.sortOrder) : undefined) : undefined,
        active: formData.active,
      };

      let response;
      if (editingSlider) {
        response = await fetch(`http://localhost:3001/sliders/${editingSlider.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch('http://localhost:3001/sliders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save slider');
      }

      addToast({
        type: 'success',
        title: 'Success',
        description: `Slider ${editingSlider ? 'updated' : 'created'} successfully.`,
      });

      setIsDialogOpen(false);
      resetForm();
      fetchSliders();
    } catch (error) {
      console.error('Error saving slider:', error);
      addToast({
        type: 'error',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save slider. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (slider: Slider) => {
    // Parse config or use defaults
    const defaultConfig: SliderConfig = {
      overlay: {
        position: 'center',
        textColor: '#ffffff',
        backgroundColor: '#000000',
        backgroundOpacity: 50,
        textAlign: 'center',
      },
      button: {
        show: true,
        text: 'Learn More',
        style: 'primary',
        position: 'overlay',
      },
      layout: {
        contentWidth: 'container',
        verticalAlign: 'center',
      },
      routing: {
        behavior: 'complete-image-and-button',
      },
    };

    const parsedConfig = slider.config ? { ...defaultConfig, ...slider.config } as SliderConfig : defaultConfig;

    setFormData({
      title: slider.title || '',
      eyebrow: slider.eyebrow || '',
      subtitle: slider.subtitle || '',
      alt: slider.alt || '',
      image: slider.image || '',
      imageFile: null,
      imageUploadMethod: slider.image && slider.image.startsWith('data:') ? 'upload' : 'url',
      href: slider.href || '',
      config: parsedConfig,
      sortOrder: slider.sortOrder.toString(),
      active: slider.active,
    });
    setEditingSlider(slider);
    setIsDialogOpen(true);
    setIsReplacingImage(false);
  };

  const handleDuplicate = (slider: Slider) => {
    // Parse config or use defaults
    const defaultConfig: SliderConfig = {
      overlay: {
        position: 'center',
        textColor: '#ffffff',
        backgroundColor: '#000000',
        backgroundOpacity: 50,
        textAlign: 'center',
      },
      button: {
        show: true,
        text: 'Learn More',
        style: 'primary',
        position: 'overlay',
      },
      layout: {
        contentWidth: 'container',
        verticalAlign: 'center',
      },
      routing: {
        behavior: 'complete-image-and-button',
      },
    };

    const parsedConfig = slider.config ? { ...defaultConfig, ...slider.config } as SliderConfig : defaultConfig;

    setEditingSlider(null);
    setFormData({
      title: slider.title || '',
      eyebrow: slider.eyebrow || '',
      subtitle: slider.subtitle || '',
      alt: slider.alt || '',
      image: slider.image || '',
      imageFile: null,
      imageUploadMethod: slider.image && slider.image.startsWith('data:') ? 'upload' : 'url',
      href: slider.href || '',
      config: parsedConfig,
      sortOrder: '',
      active: false, // Default to inactive for duplicates
    });
    setIsDialogOpen(true);
    setIsReplacingImage(false);
  };

  const handleDelete = async (id: number) => {
    setIsDeleting(id);
    try {
      const response = await fetch(`http://localhost:3001/sliders/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete slider');
      }

      addToast({
        type: 'success',
        title: 'Success',
        description: 'Slider deleted successfully.',
      });

      fetchSliders();
    } catch (error) {
      console.error('Error deleting slider:', error);
      addToast({
        type: 'error',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete slider. Please try again.',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleToggleActive = async (slider: Slider) => {
    try {
      const response = await fetch(`http://localhost:3001/sliders/${slider.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !slider.active }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update slider');
      }

      addToast({
        type: 'success',
        title: 'Success',
        description: `Slider ${!slider.active ? 'activated' : 'deactivated'} successfully.`,
      });

      fetchSliders();
    } catch (error) {
      console.error('Error updating slider:', error);
      addToast({
        type: 'error',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update slider. Please try again.',
      });
    }
  };

  const handlePreview = (slider: Slider) => {
    // Parse config or use defaults
    const defaultConfig: SliderConfig = {
      overlay: {
        position: 'center',
        textColor: '#ffffff',
        backgroundColor: '#000000',
        backgroundOpacity: 50,
        textAlign: 'center',
      },
      button: {
        show: true,
        text: 'Learn More',
        style: 'primary',
        position: 'overlay',
      },
      layout: {
        contentWidth: 'container',
        verticalAlign: 'center',
      },
      routing: {
        behavior: 'complete-image-and-button',
      },
    };

    const parsedConfig = slider.config ? { ...defaultConfig, ...slider.config } as SliderConfig : defaultConfig;

    const previewFormData: SliderFormData = {
      title: slider.title || '',
      eyebrow: slider.eyebrow || '',
      subtitle: slider.subtitle || '',
      alt: slider.alt || '',
      image: slider.image || '',
      imageFile: null,
      imageUploadMethod: slider.image && slider.image.startsWith('data:') ? 'upload' : 'url',
      href: slider.href || '',
      config: parsedConfig,
      sortOrder: slider.sortOrder.toString(),
      active: slider.active,
    };

    setPreviewData(previewFormData);
    setIsPreviewOpen(true);
  };

  const handleMoveSlider = async (slider: Slider, direction: 'up' | 'down') => {
    const currentIndex = sliders.findIndex(s => s.id === slider.id);
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === sliders.length - 1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const targetSlider = sliders[targetIndex];

    try {
      // Swap sort orders
      await Promise.all([
        fetch(`http://localhost:3001/sliders/${slider.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortOrder: targetSlider.sortOrder }),
        }),
        fetch(`http://localhost:3001/sliders/${targetSlider.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortOrder: slider.sortOrder }),
        }),
      ]);

      addToast({
        type: 'success',
        title: 'Success',
        description: 'Slider order updated successfully.',
      });

      fetchSliders();
    } catch (error) {
      console.error('Error updating slider order:', error);
      addToast({
        type: 'error',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update slider order. Please try again.',
      });
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
            <Switch
              id="include-inactive"
              checked={includeInactive}
              onCheckedChange={setIncludeInactive}
            />
            <Label htmlFor="include-inactive">Show inactive sliders</Label>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Slider
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingSlider ? 'Edit Slider' : 'Add New Slider'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Main title text"
                    />
                  </div>
                  <div>
                    <Label htmlFor="eyebrow">Eyebrow</Label>
                    <Input
                      id="eyebrow"
                      value={formData.eyebrow}
                      onChange={(e) => setFormData({ ...formData, eyebrow: e.target.value })}
                      placeholder="Small text above title"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input
                    id="subtitle"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="Subtitle text"
                  />
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
                            checked={formData.imageUploadMethod === 'url'}
                            onChange={() => setFormData({ ...formData, imageUploadMethod: 'url', imageFile: null })}
                          />
                          <Label htmlFor="image-url" className="text-sm">URL</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="image-upload"
                            name="image-method"
                            checked={formData.imageUploadMethod === 'upload'}
                            onChange={() => setFormData({ ...formData, imageUploadMethod: 'upload', image: '' })}
                          />
                          <Label htmlFor="image-upload" className="text-sm">Upload</Label>
                        </div>
                        {editingSlider && formData.image && (
                          <div className="text-xs text-muted-foreground ml-2">
                            {formData.image.startsWith('data:') ? '(Uploaded)' : '(URL)'}
                          </div>
                        )}
                      </div>
                      {/* Show preview for existing uploaded images when editing */}
                      {editingSlider && formData.image && formData.image.startsWith('data:') && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              <Image
                                src={formData.image}
                                alt="Current slider image"
                                width={64}
                                height={64}
                                className="object-cover rounded border"
                              />
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
                                setFormData({
                                  ...formData,
                                  imageUploadMethod: 'upload',
                                  imageFile: null
                                });
                                setIsReplacingImage(true);
                              }}
                            >
                              Replace
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {formData.imageUploadMethod === 'url' ? (
                        <Input
                          id="image"
                          value={formData.image}
                          onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                          placeholder="https://example.com/image.jpg"
                        />
                      ) : (
                        <div className="space-y-2">
                          {/* Show file input only if not editing existing uploaded image or if replacing */}
                          {(!editingSlider || !formData.image || !formData.image.startsWith('data:') || isReplacingImage) && (
                            <Input
                              id="image-file"
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                setFormData({ ...formData, imageFile: file });
                                // Reset replace state when a new file is selected
                                if (isReplacingImage) {
                                  setIsReplacingImage(false);
                                }
                              }}
                            />
                          )}
                          {formData.imageFile && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>Selected: {formData.imageFile.name}</span>
                              <span className="text-xs">
                                ({(formData.imageFile.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                              {formData.imageFile.size > 2 * 1024 * 1024 && (
                                <span className="text-red-500 text-xs">⚠️ File too large (max 2MB)</span>
                              )}
                            </div>
                          )}
                          {formData.image && formData.imageUploadMethod !== 'upload' && !formData.image.startsWith('data:') && (
                            <div className="mt-2">
                              <div
                                className="w-20 h-20 bg-gray-200 rounded border overflow-hidden bg-cover bg-center bg-no-repeat"
                                style={{ backgroundImage: `url(${formData.image})` }}
                              />
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Recommended: Images under 2MB. Larger images will be compressed.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="alt">Alt Text</Label>
                    <Input
                      id="alt"
                      value={formData.alt}
                      onChange={(e) => setFormData({ ...formData, alt: e.target.value })}
                      placeholder="Image alt text"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="href">Link URL</Label>
                    <Input
                      id="href"
                      value={formData.href}
                      onChange={(e) => setFormData({ ...formData, href: e.target.value })}
                      placeholder="https://example.com/page"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sortOrder">Sort Order</Label>
                    <Input
                      id="sortOrder"
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, sortOrder: e.target.value })}
                      placeholder="0"
                      min="0"
                      disabled={!editingSlider}
                    />
                    {!editingSlider && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Sort order will be auto-assigned when creating a new slider
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold">Configuration</Label>
                  
                  {/* Overlay Settings */}
                  <div className="space-y-3 p-4 border rounded-lg">
                    <Label className="text-sm font-medium">Overlay Settings</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="overlay-position">Position</Label>
                        <Select
                          value={formData.config.overlay?.position || 'center'}
                          onValueChange={(value) => setFormData({
                            ...formData,
                            config: {
                              ...formData.config,
                              overlay: {
                                position: value as 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center',
                                textColor: formData.config.overlay?.textColor ?? '#ffffff',
                                backgroundColor: formData.config.overlay?.backgroundColor ?? '#000000',
                                backgroundOpacity: formData.config.overlay?.backgroundOpacity ?? 50,
                                textAlign: formData.config.overlay?.textAlign ?? 'center',
                              },
                            },
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="top-left">Top Left</SelectItem>
                            <SelectItem value="top-right">Top Right</SelectItem>
                            <SelectItem value="bottom-left">Bottom Left</SelectItem>
                            <SelectItem value="bottom-right">Bottom Right</SelectItem>
                            <SelectItem value="top-center">Top Center</SelectItem>
                            <SelectItem value="bottom-center">Bottom Center</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="overlay-textAlign">Text Alignment</Label>
                        <Select
                          value={formData.config.overlay?.textAlign || 'center'}
                          onValueChange={(value) => setFormData({
                            ...formData,
                            config: {
                              ...formData.config,
                              overlay: {
                                position: formData.config.overlay?.position ?? 'center',
                                textColor: formData.config.overlay?.textColor ?? '#ffffff',
                                backgroundColor: formData.config.overlay?.backgroundColor ?? '#000000',
                                backgroundOpacity: formData.config.overlay?.backgroundOpacity ?? 50,
                                textAlign: value as 'left' | 'center' | 'right',
                              },
                            },
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="overlay-textColor">Text Color</Label>
                        <Input
                          id="overlay-textColor"
                          type="color"
                          value={formData.config.overlay?.textColor || '#ffffff'}
                          onChange={(e) => setFormData({
                            ...formData,
                            config: {
                              ...formData.config,
                              overlay: {
                                ...formData.config.overlay,
                                textColor: e.target.value,
                              },
                            },
                          })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="overlay-backgroundColor">Background Color</Label>
                        <Input
                          id="overlay-backgroundColor"
                          type="color"
                          value={formData.config.overlay?.backgroundColor || '#000000'}
                          onChange={(e) => setFormData({
                            ...formData,
                            config: {
                              ...formData.config,
                              overlay: {
                                ...formData.config.overlay,
                                backgroundColor: e.target.value,
                              },
                            },
                          })}
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
                        value={formData.config.overlay?.backgroundOpacity || 50}
                        onChange={(e) => setFormData({
                          ...formData,
                          config: {
                            ...formData.config,
                            overlay: {
                              ...formData.config.overlay,
                              backgroundOpacity: parseInt(e.target.value) || 0,
                            },
                          },
                        })}
                      />
                    </div>
                  </div>

                  {/* Button Settings */}
                  <div className="space-y-3 p-4 border rounded-lg">
                    <Label className="text-sm font-medium">Button Settings</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="button-show"
                        checked={formData.config.button?.show || false}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          config: {
                            ...formData.config,
                            button: {
                              ...formData.config.button,
                              show: checked,
                            },
                          },
                        })}
                      />
                      <Label htmlFor="button-show">Show Button</Label>
                    </div>
                    {formData.config.button?.show && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="button-text">Button Text</Label>
                            <Input
                              id="button-text"
                              value={formData.config.button?.text || ''}
                              onChange={(e) => setFormData({
                                ...formData,
                                config: {
                                  ...formData.config,
                                  button: {
                                    ...formData.config.button,
                                    text: e.target.value,
                                  },
                                },
                              })}
                              placeholder="Learn More"
                            />
                          </div>
                          <div>
                            <Label htmlFor="button-style">Button Style</Label>
                        <Select
                          value={formData.config.button?.style || 'primary'}
                          onValueChange={(value) => setFormData({
                            ...formData,
                            config: {
                              ...formData.config,
                              button: {
                                show: formData.config.button?.show ?? true,
                                text: formData.config.button?.text ?? 'Learn More',
                                position: formData.config.button?.position ?? 'overlay',
                                style: value as 'primary' | 'secondary' | 'outline',
                              },
                            },
                          })}
                        >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="primary">Primary</SelectItem>
                                <SelectItem value="secondary">Secondary</SelectItem>
                                <SelectItem value="outline">Outline</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="button-position">Button Position</Label>
                          <Select
                            value={formData.config.button?.position || 'overlay'}
                            onValueChange={(value) => setFormData({
                              ...formData,
                              config: {
                                ...formData.config,
                                button: {
                                  show: formData.config.button?.show ?? true,
                                  text: formData.config.button?.text ?? 'Learn More',
                                  style: formData.config.button?.style ?? 'primary',
                                  position: value as 'overlay' | 'below',
                                },
                              },
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="overlay">Overlay</SelectItem>
                              <SelectItem value="below">Below Content</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Routing Settings */}
                  <div className="space-y-3 p-4 border rounded-lg">
                    <Label className="text-sm font-medium">Routing Settings</Label>
                    <div>
                      <Label htmlFor="routing-behavior">Routing Behavior</Label>
                      <Select
                        value={formData.config.routing?.behavior || 'complete-image-and-button'}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          config: {
                            ...formData.config,
                            routing: {
                              behavior: value as 'complete-image-and-button' | 'button-only',
                            },
                          },
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="complete-image-and-button">Complete Image & Button</SelectItem>
                          <SelectItem value="button-only">Button Only</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Choose whether the entire slider image/content and button should be clickable or only the button.
                      </p>
                    </div>
                  </div>

                  {/* Layout Settings */}
                  <div className="space-y-3 p-4 border rounded-lg">
                    <Label className="text-sm font-medium">Layout Settings</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="layout-contentWidth">Content Width</Label>
                        <Select
                          value={formData.config.layout?.contentWidth || 'container'}
                          onValueChange={(value) => setFormData({
                            ...formData,
                            config: {
                              ...formData.config,
                              layout: {
                                contentWidth: value as 'full' | 'container' | 'narrow',
                                verticalAlign: formData.config.layout?.verticalAlign ?? 'center',
                              },
                            },
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full">Full Width</SelectItem>
                            <SelectItem value="container">Container</SelectItem>
                            <SelectItem value="narrow">Narrow</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="layout-verticalAlign">Vertical Alignment</Label>
                        <Select
                          value={formData.config.layout?.verticalAlign || 'center'}
                          onValueChange={(value) => setFormData({
                            ...formData,
                            config: {
                              ...formData.config,
                              layout: {
                                contentWidth: formData.config.layout?.contentWidth ?? 'container',
                                verticalAlign: value as 'top' | 'center' | 'bottom',
                              },
                            },
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="top">Top</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="bottom">Bottom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  />
                  <Label htmlFor="active">Active (visible on homepage)</Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsPreviewOpen(true)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingSlider ? 'Update' : 'Create'} Slider
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Preview Dialog */}
          <Dialog open={isPreviewOpen} onOpenChange={(open) => {
            setIsPreviewOpen(open);
            if (!open) {
              setPreviewData(null);
            }
          }}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Slider Preview</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  This is how your slider will appear on the website:
                </div>
                
                {/* Slider Preview */}
                <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
                  {(((previewData || formData).config.routing?.behavior === 'complete-image-and-button') || ((previewData || formData).config.routing?.behavior === 'whole-image')) && (previewData || formData).href ? (
                    <a
                      href={(previewData || formData).href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 z-10"
                      title="Click to navigate"
                    />
                  ) : null}
                  
                  {/* Background Image */}
                  {(previewData || formData).image && (
                    <div
                      className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                      style={{ backgroundImage: `url(${(previewData || formData).image})` }}
                    />
                  )}
                  
                  {/* Overlay */}
                  {(previewData || formData).config.overlay && (
                    <div
                      className={`absolute inset-0 flex items-center justify-center ${
                        (previewData || formData).config.overlay?.position === 'top-left' ? 'items-start justify-start' :
                        (previewData || formData).config.overlay?.position === 'top-right' ? 'items-start justify-end' :
                        (previewData || formData).config.overlay?.position === 'bottom-left' ? 'items-end justify-start' :
                        (previewData || formData).config.overlay?.position === 'bottom-right' ? 'items-end justify-end' :
                        (previewData || formData).config.overlay?.position === 'top-center' ? 'items-start justify-center' :
                        (previewData || formData).config.overlay?.position === 'bottom-center' ? 'items-end justify-center' :
                        'items-center justify-center'
                      }`}
                      style={{
                        backgroundColor: (previewData || formData).config.overlay?.backgroundColor ? 
                          `${(previewData || formData).config.overlay?.backgroundColor}${Math.round(((previewData || formData).config.overlay?.backgroundOpacity || 50) * 2.55).toString(16).padStart(2, '0')}` : 
                          'rgba(0, 0, 0, 0.5)',
                      }}
                    >
                      <div className={`text-center p-6 max-w-2xl ${
                        (previewData || formData).config.overlay?.textAlign === 'left' ? 'text-left' :
                        (previewData || formData).config.overlay?.textAlign === 'right' ? 'text-right' :
                        'text-center'
                      }`} style={{ color: (previewData || formData).config.overlay?.textColor || '#ffffff' }}>
                        {(previewData || formData).eyebrow && (
                          <div className="text-sm font-light mb-2 opacity-90">
                            {(previewData || formData).eyebrow}
                          </div>
                        )}
                        {(previewData || formData).title && (
                          <h1 className="text-4xl font-bold mb-4">
                            {(previewData || formData).title}
                          </h1>
                        )}
                        {(previewData || formData).subtitle && (
                          <p className="text-lg opacity-90 mb-6">
                            {(previewData || formData).subtitle}
                          </p>
                        )}
                        
                        {/* Button */}
                        {(previewData || formData).config.button?.show && (
                          <div className={`${
                            (previewData || formData).config.button?.position === 'below' ? 'mt-6' : ''
                          }`}>
                            {(previewData || formData).config.routing?.behavior === 'button-only' && (previewData || formData).href ? (
                              <a
                                href={(previewData || formData).href}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <button
                                  className={`px-6 py-3 rounded font-medium transition-colors ${
                                    (previewData || formData).config.button?.style === 'primary' ? 
                                      'bg-blue-600 text-white hover:bg-blue-700' :
                                    (previewData || formData).config.button?.style === 'secondary' ?
                                      'bg-gray-600 text-white hover:bg-gray-700' :
                                      'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  {(previewData || formData).config.button?.text || 'Learn More'}
                                </button>
                              </a>
                            ) : (
                              <button
                                className={`px-6 py-3 rounded font-medium transition-colors ${
                                  (previewData || formData).config.button?.style === 'primary' ? 
                                    'bg-blue-600 text-white hover:bg-blue-700' :
                                  (previewData || formData).config.button?.style === 'secondary' ?
                                    'bg-gray-600 text-white hover:bg-gray-700' :
                                    'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                {(previewData || formData).config.button?.text || 'Learn More'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* No image placeholder */}
                  {!(previewData || formData).image && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                      <div className="text-center text-gray-500">
                        <div className="text-6xl mb-4">🖼️</div>
                        <div>No image selected</div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Configuration Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-2">Content</h4>
                    <div className="space-y-1 text-muted-foreground">
                      <div>Title: {(previewData || formData).title || 'None'}</div>
                      <div>Eyebrow: {(previewData || formData).eyebrow || 'None'}</div>
                      <div>Subtitle: {(previewData || formData).subtitle || 'None'}</div>
                      <div>Link: {(previewData || formData).href || 'None'}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Configuration</h4>
                    <div className="space-y-1 text-muted-foreground">
                      <div>Image: {(previewData || formData).image ? ((previewData || formData).imageUploadMethod === 'upload' ? 'Uploaded' : 'URL') : 'None'}</div>
                      <div>Overlay: {(previewData || formData).config.overlay ? 'Enabled' : 'Disabled'}</div>
                      <div>Button: {(previewData || formData).config.button?.show ? 'Enabled' : 'Disabled'}</div>
                      <div>Routing: {((previewData || formData).config.routing?.behavior === 'complete-image-and-button') || ((previewData || formData).config.routing?.behavior === 'whole-image') ? 'Complete Image & Button' : 'Button Only'}</div>
                      <div>Status: {(previewData || formData).active ? 'Active' : 'Inactive'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sliders ({sliders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {sliders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sliders found. Create your first slider to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                      <TableHead className="w-24">Order</TableHead>
                      <TableHead className="min-w-64">Title</TableHead>
                      <TableHead className="w-32">Image</TableHead>
                      <TableHead className="w-32">Status</TableHead>
                      <TableHead className="w-48">Actions</TableHead>
                    </TableRow>
                </TableHeader>
              <TableBody>
                {sliders.map((slider) => (
                  <TableRow key={slider.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{slider.sortOrder}</span>
                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMoveSlider(slider, 'up')}
                            disabled={slider.sortOrder === Math.min(...sliders.map(s => s.sortOrder))}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMoveSlider(slider, 'down')}
                            disabled={slider.sortOrder === Math.max(...sliders.map(s => s.sortOrder))}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-48 break-words">
                        {slider.eyebrow && <div className="text-sm text-muted-foreground">{slider.eyebrow}</div>}
                        <div className="font-medium">{slider.title || 'No title'}</div>
                        {slider.subtitle && <div className="text-sm text-muted-foreground">{slider.subtitle}</div>}
                        {slider.href && <div className="text-xs text-blue-600 truncate">{slider.href}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {slider.image ? (
                        <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center overflow-hidden">
                          <div
                            className="w-full h-full bg-cover bg-center bg-no-repeat"
                            style={{ backgroundImage: `url(${slider.image})` }}
                            title={slider.alt || 'Slider image'}
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                          No image
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={slider.active}
                          onCheckedChange={() => handleToggleActive(slider)}
                        />
                        <span className={slider.active ? 'text-green-600' : 'text-red-600'}>
                          {slider.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => handlePreview(slider)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(slider)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDuplicate(slider)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" disabled={isDeleting === slider.id}>
                              {isDeleting === slider.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Slider</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this slider? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(slider.id)}>
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
