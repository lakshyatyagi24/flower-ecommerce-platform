"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Loader2, Trash2, Star } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { adminApi, AdminReview, AdminProduct, ApiError } from "@/lib/api";

function StarRow({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < value ? "fill-amber-400 text-amber-400" : "text-amber-200"}`}
        />
      ))}
    </span>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [productFilter, setProductFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { addToast } = useToast();

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const productId = productFilter ? parseInt(productFilter, 10) : undefined;
      const res = await adminApi.listReviews({ productId, take: 200 });
      setReviews(res.items);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to load reviews";
      addToast({ type: "error", title: "Error", description: message });
    } finally {
      setLoading(false);
    }
  }, [productFilter, addToast]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .listProducts({ take: 200 })
      .then((res) => {
        if (!cancelled) setProducts(res.items);
      })
      .catch(() => {
        // Filter is non-essential — silently skip if it fails.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await adminApi.deleteReview(id);
      addToast({ type: "success", title: "Review deleted", description: `Review #${id} removed.` });
      fetchReviews();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to delete review";
      addToast({ type: "error", title: "Error", description: message });
    } finally {
      setDeletingId(null);
    }
  };

  const summary = useMemo(() => {
    if (reviews.length === 0) return null;
    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    return (total / reviews.length).toFixed(2);
  }, [reviews]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reviews</h1>
          <p className="text-muted-foreground">Moderate customer feedback</p>
        </div>
        <select
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value)}
          className="p-2 border rounded text-sm"
        >
          <option value="">All products</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Reviews ({reviews.length})
            {summary && (
              <span className="ml-3 text-sm font-normal text-muted-foreground">
                Avg rating {summary}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-muted-foreground text-sm">No reviews yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Reviewer</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Review</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      {r.product?.name ?? `#${r.productId}`}
                    </TableCell>
                    <TableCell>
                      <div>{r.user?.name?.trim() || "Anonymous"}</div>
                      <div className="text-xs text-muted-foreground">User #{r.userId}</div>
                    </TableCell>
                    <TableCell>
                      <StarRow value={r.rating} />
                    </TableCell>
                    <TableCell className="max-w-md">
                      {r.title && <div className="font-semibold text-sm">{r.title}</div>}
                      <div className="text-sm text-muted-foreground line-clamp-2">{r.body}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={deletingId === r.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete review?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove the review by{" "}
                              {r.user?.name ?? "this user"} on{" "}
                              {r.product?.name ?? `product #${r.productId}`}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(r.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
