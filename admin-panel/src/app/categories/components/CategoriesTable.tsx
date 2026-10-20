import { ChevronDown, ChevronRight, Edit, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { AdminCategory } from '@/lib/api';
import { visibleRows, VisibleRow } from '../category-form';

type RowActions = {
  expanded: Set<number>;
  deletingId: number | null;
  onToggle: (id: number) => void;
  onEdit: (category: AdminCategory) => void;
  onDelete: (id: number) => void;
};

function ExpandToggle({ category, expanded, onToggle }: { category: AdminCategory; expanded: boolean; onToggle: (id: number) => void }) {
  if (!category.children || category.children.length === 0) return <span className="inline-block w-4 mr-2" />;
  return (
    <Button variant="ghost" size="sm" onClick={() => onToggle(category.id)} className="mr-2 p-0 h-4 w-4">
      {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
    </Button>
  );
}

function DeleteCategoryButton({ category, busy, onDelete }: { category: AdminCategory; busy: boolean; onDelete: (id: number) => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={busy}>
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the category &ldquo;{category.name}&rdquo;. A category can
            only be deleted if it has no subcategories and no products assigned to it.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onDelete(category.id)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function NameCell({ row, actions }: { row: VisibleRow; actions: RowActions }) {
  const { category, level } = row;
  return (
    <div style={{ paddingLeft: `${level * 20}px` }} className="flex items-center">
      <ExpandToggle category={category} expanded={actions.expanded.has(category.id)} onToggle={actions.onToggle} />
      <span>{category.name}</span>
      {category.active === false && (
        <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
          Hidden
        </span>
      )}
    </div>
  );
}

function CategoryRow({ row, actions }: { row: VisibleRow; actions: RowActions }) {
  const { category } = row;
  return (
    <TableRow className={category.active === false ? 'opacity-60' : ''}>
      <TableCell>
        <NameCell row={row} actions={actions} />
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">{category.slug}</TableCell>
      <TableCell>{category.productType ? category.productType.replace('_', ' ').toLowerCase() : '—'}</TableCell>
      <TableCell>{category.defaultSaleMode || '—'}</TableCell>
      <TableCell>{category.sortOrder ?? '—'}</TableCell>
      <TableCell>{category.image ? 'Yes' : 'No'}</TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => actions.onEdit(category)}>
            <Edit className="h-3 w-3" />
          </Button>
          <DeleteCategoryButton category={category} busy={actions.deletingId === category.id} onDelete={actions.onDelete} />
        </div>
      </TableCell>
    </TableRow>
  );
}

const COLUMNS = ['Name', 'Slug', 'Type', 'Sale mode', 'Order', 'Image', 'Actions'];

export function CategoriesTable({ categories, ...actions }: RowActions & { categories: AdminCategory[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {COLUMNS.map((c) => (
            <TableHead key={c}>{c}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {visibleRows(categories, actions.expanded).map((row) => (
          <CategoryRow key={row.category.id} row={row} actions={actions} />
        ))}
      </TableBody>
    </Table>
  );
}
