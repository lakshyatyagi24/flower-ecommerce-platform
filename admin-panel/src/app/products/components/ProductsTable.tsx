import { Edit, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { AdminProduct } from "@/lib/api";
import { formatINR } from "@/lib/currency";

type ProductsTableProps = {
  products: AdminProduct[];
  deleting: number | null;
  onEdit: (product: AdminProduct) => void;
  onDelete: (id: number) => void;
};

function ProductImage({ image }: { image: string | null }) {
  if (image) return <div className="w-12 h-12 rounded bg-cover bg-center" style={{ backgroundImage: `url(${image})` }} />;
  return <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center">🌸</div>;
}

function TypeCell({ product }: { product: AdminProduct }) {
  const isEnquiry = product.saleMode === "ENQUIRY";
  return (
    <div className="flex flex-col gap-0.5 text-xs">
      <span className={isEnquiry ? "text-purple-700 font-medium" : "text-slate-600"}>
        {isEnquiry ? "Enquiry-only" : "Purchase"}
      </span>
      {product.productType && (
        <span className="text-muted-foreground capitalize">{product.productType.replace(/_/g, " ").toLowerCase()}</span>
      )}
    </div>
  );
}

function StatusCell({ product }: { product: AdminProduct }) {
  return (
    <div className="flex flex-col gap-1 text-xs">
      <span className={product.active ? "text-green-700" : "text-red-600"}>{product.active ? "Active" : "Inactive"}</span>
      {product.featured && <span className="text-amber-700">Featured</span>}
    </div>
  );
}

function DeleteProductButton({ product, busy, onDelete }: { product: AdminProduct; busy: boolean; onDelete: (id: number) => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={busy}>
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &ldquo;{product.name}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            If this product has past orders it will be deactivated rather than deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onDelete(product.id)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ProductRow({ product, deleting, onEdit, onDelete }: Omit<ProductsTableProps, "products"> & { product: AdminProduct }) {
  return (
    <TableRow>
      <TableCell>
        <ProductImage image={product.image} />
      </TableCell>
      <TableCell>
        <div className="font-medium">{product.name}</div>
        <div className="text-xs text-muted-foreground">{product.slug}</div>
      </TableCell>
      <TableCell>{product.category?.name ?? "—"}</TableCell>
      <TableCell>
        <TypeCell product={product} />
      </TableCell>
      <TableCell>{formatINR(product.price)}</TableCell>
      <TableCell>{product.stock}</TableCell>
      <TableCell>
        <StatusCell product={product} />
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={() => onEdit(product)}>
            <Edit className="h-3 w-3" />
          </Button>
          <DeleteProductButton product={product} busy={deleting === product.id} onDelete={onDelete} />
        </div>
      </TableCell>
    </TableRow>
  );
}

export function ProductsTable({ products, deleting, onEdit, onDelete }: ProductsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-20">Image</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-32">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((p) => (
          <ProductRow key={p.id} product={p} deleting={deleting} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </TableBody>
    </Table>
  );
}
