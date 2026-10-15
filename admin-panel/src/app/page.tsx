"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Package, ShoppingCart, Users, Loader2, MessageSquare, Clock, RotateCcw, AlertTriangle } from "lucide-react";
import { adminApi, ApiError, type AdminStats, type AdminStatsSeriesPoint } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { SalesTrend } from "@/components/dashboard/SalesTrend";
import { DEFAULT_RANGE, formatINR, rangeForDays, type RangeDays } from "@/lib/dashboard";

// A missing/failed value must read as "unknown" (—), never as a reassuring 0.
function numOrNull(v: number | undefined): number | null {
  return typeof v === "number" ? v : null;
}

function PaymentCard({
  title,
  count,
  href,
  icon,
  hint,
  urgent,
}: {
  title: string;
  count: number | null;
  href: string;
  icon: React.ReactNode;
  hint: string;
  urgent?: boolean;
}) {
  const emphasised = !!urgent && count !== null && count > 0;
  return (
    <Link href={href} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <Card className={emphasised ? "border-destructive bg-destructive/10" : undefined}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <span className={emphasised ? "text-destructive" : undefined}>{icon}</span>
        </CardHeader>
        <CardContent>
          <div className={emphasised ? "text-2xl font-bold text-destructive" : "text-2xl font-bold"}>{count === null ? "—" : count}</div>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsFailed, setStatsFailed] = useState(false);
  const [days, setDays] = useState<RangeDays>(DEFAULT_RANGE);
  // Series already fetched, keyed by range length, so toggling back and forth does not refetch.
  const [seriesByDays, setSeriesByDays] = useState<Partial<Record<RangeDays, AdminStatsSeriesPoint[]>>>({});
  // Ranges whose request failed: an error for one range must never hide valid data of another.
  const [failedRanges, setFailedRanges] = useState<Partial<Record<RangeDays, true>>>({});
  const { addToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    adminApi
      .stats(rangeForDays(DEFAULT_RANGE))
      .then((s) => {
        if (cancelled) return;
        setStats(s);
        if (s.series) setSeriesByDays({ [DEFAULT_RANGE]: s.series });
        else setFailedRanges({ [DEFAULT_RANGE]: true });
      })
      .catch((err) => {
        if (cancelled) return;
        setStatsFailed(true);
        setFailedRanges({ [DEFAULT_RANGE]: true });
        if (err instanceof ApiError && err.status === 401) return; // the auth provider announces the expiry
        const message = err instanceof ApiError ? err.message : "Failed to load stats";
        addToast({ type: "error", title: "Error", description: message });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [addToast]);

  const loadSeries = useCallback(async (range: RangeDays) => {
    setFailedRanges((prev) => ({ ...prev, [range]: undefined }));
    try {
      const res = await adminApi.stats(rangeForDays(range));
      if (!res.series) throw new Error("No series");
      setSeriesByDays((prev) => ({ ...prev, [range]: res.series }));
    } catch {
      setFailedRanges((prev) => ({ ...prev, [range]: true }));
    }
  }, []);

  const changeDays = (next: RangeDays) => {
    setDays(next);
    if (!seriesByDays[next]) void loadSeries(next);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your flower ecommerce platform</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats ? formatINR(stats.revenue) : "—"}</div>
            <p className="text-xs text-muted-foreground">All-time: cash on delivery + paid online, excluding cancelled and refunded</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.productCount ?? "—"}</div>
            <p className="text-xs text-muted-foreground">In catalog</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.orderCount ?? "—"}</div>
            <p className="text-xs text-muted-foreground">All-time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open enquiries</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.openEnquiries ?? "—"}</div>
            <p className="text-xs text-muted-foreground">Need response</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.customerCount ?? "—"}</div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>
      </div>

      {statsFailed && (
        <p role="alert" className="text-sm text-destructive">
          Couldn&apos;t load payment counts
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        <PaymentCard
          title="Awaiting payment"
          count={numOrNull(stats?.unpaidOnline)}
          href="/orders?attention=awaiting"
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          hint="Online orders not paid yet"
        />
        <PaymentCard
          title="Refunds owed"
          count={numOrNull(stats?.refundsDue)}
          href="/orders?attention=refund"
          icon={<RotateCcw className="h-4 w-4" />}
          hint="Paid, then cancelled — refund in Razorpay"
          urgent
        />
        <PaymentCard
          title="Check payments"
          count={numOrNull(stats?.mismatches)}
          href="/orders?attention=mismatch"
          icon={<AlertTriangle className="h-4 w-4" />}
          hint="Captured payment needs manual review"
          urgent
        />
      </div>

      <SalesTrend
        days={days}
        onDaysChange={changeDays}
        series={stats ? seriesByDays[days] : undefined}
        failed={!!failedRanges[days] && !seriesByDays[days]}
        onRetry={() => (stats ? void loadSeries(days) : window.location.reload())}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent orders</CardTitle>
          </CardHeader>
          <CardContent>
            {stats && stats.recentOrders.length > 0 ? (
              <ul className="divide-y">
                {stats.recentOrders.map((o) => (
                  <li key={o.id} className="py-3 flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium">#{o.id} — {o.customerName || "Guest"}</div>
                      <div className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatINR(o.total)}</div>
                      <div className="text-xs text-muted-foreground">{o.status}</div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No recent orders yet.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Getting started</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
              <li>Create or import categories.</li>
              <li>Add products with images, price, and stock.</li>
              <li>Configure store info & shipping in Settings.</li>
              <li>Watch orders flow in from the storefront.</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
