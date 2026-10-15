"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { Check, Loader2, RotateCcw, Star, Trash2, X } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { REVIEWS_CHANGED_EVENT } from "@/lib/review-events";
import { adminApi, AdminReview, AdminReviewStatus, AdminProduct, ApiError } from "@/lib/api";

const TABS: { status: AdminReviewStatus; label: string; empty: string }[] = [
  { status: "PENDING", label: "Pending", empty: "Nothing is waiting for approval." },
  { status: "APPROVED", label: "Approved", empty: "No approved reviews yet. Approved reviews are the only ones shown on the shop." },
  { status: "REJECTED", label: "Rejected", empty: "No rejected reviews." },
];

function StarRow({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${value} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          aria-hidden
          className={`h-4 w-4 ${i < value ? "fill-amber-400 text-amber-500" : "text-amber-300"}`}
        />
      ))}
    </span>
  );
}

export default function ReviewsPage() {
  const [tab, setTab] = useState<AdminReviewStatus>("PENDING");
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [shownTotal, setShownTotal] = useState(0);
  const [counts, setCounts] = useState<Record<AdminReviewStatus, number> | null>(null);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [productFilter, setProductFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [liveMessage, setLiveMessage] = useState("");
  const { addToast } = useToast();
  const requestSeq = useRef(0);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const fetchReviews = useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    try {
      const productId = productFilter ? parseInt(productFilter, 10) : undefined;
      const res = await adminApi.listReviews({ productId, status: tab, take: 200 });
      if (seq !== requestSeq.current) return; // a newer tab/filter request superseded this one
      setReviews(res.items);
      setShownTotal(res.total);
      setCounts(res.counts);
      setLoadFailed(false);
    } catch (err) {
      if (seq !== requestSeq.current) return;
      setLoadFailed(true);
      const message = err instanceof ApiError ? err.message : "Failed to load reviews";
      addToast({ type: "error", title: "Error", description: message });
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [productFilter, tab, addToast]);

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
        // The product filter is non-essential; skip silently if it fails.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const moveTo = async (r: AdminReview, status: AdminReviewStatus, verb: string) => {
    setBusyId(r.id);
    try {
      await adminApi.setReviewStatus(r.id, status);
      setLiveMessage(`Review by ${r.user?.name?.trim() || "a customer"} ${verb}.`);
      addToast({ type: "success", title: `Review ${verb}`, description: `Review #${r.id} is now ${status.toLowerCase()}.` });
      window.dispatchEvent(new Event(REVIEWS_CHANGED_EVENT));
      await fetchReviews();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to update the review";
      addToast({ type: "error", title: "Error", description: message });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: number) => {
    setBusyId(id);
    try {
      await adminApi.deleteReview(id);
      addToast({ type: "success", title: "Review deleted", description: `Review #${id} removed.` });
      window.dispatchEvent(new Event(REVIEWS_CHANGED_EVENT));
      await fetchReviews();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to delete review";
      addToast({ type: "error", title: "Error", description: message });
    } finally {
      setBusyId(null);
    }
  };

  const onTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    let next = index;
    if (e.key === "ArrowRight") next = (index + 1) % TABS.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = TABS.length - 1;
    else return;
    e.preventDefault();
    setTab(TABS[next].status);
    tabRefs.current[TABS[next].status]?.focus();
  };

  const current = TABS.find((t) => t.status === tab)!;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reviews</h1>
          <p className="text-muted-foreground">
            Only customers with a completed order can review. Approve a review to publish it; nothing shows on the shop until you do.
          </p>
        </div>
        <label className="text-sm">
          <span className="sr-only">Filter by product</span>
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="p-2 border rounded text-sm bg-background"
          >
            <option value="">All products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div role="tablist" aria-label="Review status" className="flex gap-2 border-b">
        {TABS.map((t, i) => {
          const selected = t.status === tab;
          return (
            <button
              key={t.status}
              ref={(el) => {
                tabRefs.current[t.status] = el;
              }}
              type="button"
              role="tab"
              id={`reviews-tab-${t.status}`}
              aria-selected={selected}
              aria-controls="reviews-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => setTab(t.status)}
              onKeyDown={(e) => onTabKeyDown(e, i)}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                selected ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
              {counts && <span className="ml-2 text-xs text-muted-foreground">({counts[t.status]})</span>}
            </button>
          );
        })}
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {liveMessage}
      </p>

      <Card role="tabpanel" id="reviews-panel" aria-labelledby={`reviews-tab-${tab}`}>
        <CardHeader>
          <CardTitle>{current.label} reviews</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading reviews" />
            </div>
          ) : loadFailed ? (
            <div className="space-y-3">
              <p className="text-sm text-red-700">Could not load reviews.</p>
              <Button variant="outline" size="sm" onClick={fetchReviews}>
                Try again
              </Button>
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-muted-foreground text-sm">{current.empty}</p>
          ) : (
            <>
            {shownTotal > reviews.length && (
              <p className="mb-3 text-sm text-muted-foreground">
                Showing {reviews.length} of {shownTotal}.{tab === "PENDING" ? " Oldest first; approve or reject some to see the rest." : " Newest first; use the product filter to narrow the list."}
              </p>
            )}
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
                {reviews.map((r) => {
                  const busy = busyId === r.id;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.product?.name ?? `#${r.productId}`}</TableCell>
                      <TableCell>
                        <div>{r.user?.name?.trim() || "Anonymous"}</div>
                        <div className="text-xs text-muted-foreground">{r.user?.email ?? `User #${r.userId}`}</div>
                      </TableCell>
                      <TableCell>
                        <StarRow value={r.rating} />
                      </TableCell>
                      <TableCell className="max-w-md">
                        {r.title && <div className="font-semibold text-sm">{r.title}</div>}
                        {/* Plain text only: customer text is never rendered as HTML. */}
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{r.body}</div>
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          {r.status !== "APPROVED" && (
                            <Button size="sm" disabled={busy} onClick={() => moveTo(r, "APPROVED", "approved")}>
                              <Check className="mr-1 h-4 w-4" aria-hidden />
                              Approve
                            </Button>
                          )}
                          {r.status === "PENDING" && (
                            <Button size="sm" variant="outline" disabled={busy} onClick={() => moveTo(r, "REJECTED", "rejected")}>
                              <X className="mr-1 h-4 w-4" aria-hidden />
                              Reject
                            </Button>
                          )}
                          {r.status === "APPROVED" && (
                            <Button size="sm" variant="outline" disabled={busy} onClick={() => moveTo(r, "REJECTED", "unpublished and rejected")}>
                              <X className="mr-1 h-4 w-4" aria-hidden />
                              Reject
                            </Button>
                          )}
                          {r.status !== "PENDING" && (
                            <Button size="sm" variant="ghost" disabled={busy} onClick={() => moveTo(r, "PENDING", "reopened")}>
                              <RotateCcw className="mr-1 h-4 w-4" aria-hidden />
                              Reopen
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" disabled={busy} aria-label={`Delete review by ${r.user?.name?.trim() || "this customer"}`}>
                                <Trash2 className="h-4 w-4" aria-hidden />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete review?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This permanently removes the review by {r.user?.name ?? "this user"} on{" "}
                                  {r.product?.name ?? `product #${r.productId}`}. To hide it without deleting, use Reject instead.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(r.id)}>Delete</AlertDialogAction>
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
