'use client';

import { ArrowDown, ArrowUp, Copy, Edit, Eye, Loader2, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { AdminSlider } from '@/lib/api';

interface SliderListProps {
  sliders: AdminSlider[];
  deletingId: number | null;
  onPreview: (slider: AdminSlider) => void;
  onEdit: (slider: AdminSlider) => void;
  onDuplicate: (slider: AdminSlider) => void;
  onDelete: (id: number) => void;
  onToggleActive: (slider: AdminSlider) => void;
  onMove: (slider: AdminSlider, direction: 'up' | 'down') => void;
}

export function SliderList({
  sliders, deletingId, onPreview, onEdit, onDuplicate, onDelete, onToggleActive, onMove,
}: SliderListProps) {
  const minOrder = Math.min(...sliders.map((s) => s.sortOrder));
  const maxOrder = Math.max(...sliders.map((s) => s.sortOrder));

  return (
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
                {sliders.map((slider) => {
                  const label = slider.title || `slider ${slider.id}`;
                  return (
                    <TableRow key={slider.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{slider.sortOrder}</span>
                          <div className="flex flex-col gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              aria-label={`Move ${label} up`}
                              onClick={() => onMove(slider, 'up')}
                              disabled={slider.sortOrder === minOrder}
                            >
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              aria-label={`Move ${label} down`}
                              onClick={() => onMove(slider, 'down')}
                              disabled={slider.sortOrder === maxOrder}
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
                            aria-label={`${slider.active ? 'Deactivate' : 'Activate'} ${label}`}
                            onCheckedChange={() => onToggleActive(slider)}
                          />
                          <span className={slider.active ? 'text-green-600' : 'text-red-600'}>
                            {slider.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" aria-label={`Preview ${label}`} onClick={() => onPreview(slider)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" aria-label={`Edit ${label}`} onClick={() => onEdit(slider)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" aria-label={`Duplicate ${label}`} onClick={() => onDuplicate(slider)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" aria-label={`Delete ${label}`} disabled={deletingId === slider.id}>
                                {deletingId === slider.id ? (
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
                                <AlertDialogAction onClick={() => onDelete(slider.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
