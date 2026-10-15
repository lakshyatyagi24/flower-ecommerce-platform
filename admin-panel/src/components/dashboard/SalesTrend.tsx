'use client';

import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { AdminStatsSeriesPoint } from '@/lib/api';
import { RANGE_OPTIONS, summarizeSeries, type RangeDays } from '@/lib/dashboard';

// recharts is ~100 kB: load it only when the dashboard actually shows a chart.
const SalesCharts = dynamic(() => import('./SalesCharts'), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

function ChartSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2" aria-hidden="true">
      <Skeleton className="h-72" />
      <Skeleton className="h-72" />
    </div>
  );
}

interface SalesTrendProps {
  days: RangeDays;
  onDaysChange: (days: RangeDays) => void;
  /** undefined while loading */
  series: AdminStatsSeriesPoint[] | undefined;
  failed: boolean;
  onRetry: () => void;
}

export function SalesTrend({ days, onDaysChange, series, failed, onRetry }: SalesTrendProps) {
  const empty = series ? summarizeSeries(series).empty : false;

  return (
    <section aria-labelledby="sales-trend-heading" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="sales-trend-heading" className="text-xl font-semibold">Sales trend</h2>
          <p className="text-sm text-muted-foreground">
            By day, India time. Orders exclude cancelled ones; revenue counts cash on delivery and paid online orders.
          </p>
        </div>
        <div role="group" aria-label="Time range" className="inline-flex gap-1 rounded-lg border p-1">
          {RANGE_OPTIONS.map((option) => (
            <Button
              key={option}
              type="button"
              size="sm"
              variant={option === days ? 'default' : 'ghost'}
              aria-pressed={option === days}
              onClick={() => onDaysChange(option)}
            >
              {option} days
            </Button>
          ))}
        </div>
      </div>

      <div aria-live="polite" aria-busy={!series && !failed}>
        {failed ? (
          <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            <span>Couldn&apos;t load the sales chart.</span>
            <Button type="button" size="sm" variant="outline" onClick={onRetry}>Try again</Button>
          </div>
        ) : !series ? (
          <ChartSkeleton />
        ) : empty ? (
          <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
            No orders in the last {days} days yet.
          </div>
        ) : (
          <SalesCharts series={series} days={days} />
        )}
      </div>
    </section>
  );
}
