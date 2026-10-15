'use client';

// Heavy part (recharts). Always imported through next/dynamic from SalesTrend so it stays out of the
// dashboard's initial bundle.
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { AdminStatsSeriesPoint } from '@/lib/api';
import { describeSeries, formatDay, formatINR, formatINRCompact } from '@/lib/dashboard';

// Admin chart tokens (globals.css): chart-3 is a dark blue, chart-1 an orange; both are >= 3:1 against the
// white card, and axis text uses --muted-foreground (>= 4.5:1).
const ORDERS_COLOR = 'var(--chart-3)';
const REVENUE_COLOR = 'var(--chart-1)';
const AXIS_TEXT = { fill: 'var(--muted-foreground)', fontSize: 12 };

interface ChartCardProps {
  title: string;
  summary: string;
  dataKey: 'orders' | 'revenue';
  color: string;
  series: AdminStatsSeriesPoint[];
  tickFormatter: (v: number) => string;
  valueFormatter: (v: number) => string;
  seriesName: string;
}

function ChartCard({ title, summary, dataKey, color, series, tickFormatter, valueFormatter, seriesName }: ChartCardProps) {
  return (
    <figure className="rounded-xl border bg-card p-4 text-card-foreground shadow-sm">
      <figcaption className="mb-2 text-sm font-medium">{title}</figcaption>
      {/* The SVG is decorative for assistive tech; the sentence and the data table carry the information. */}
      <p className="sr-only">{summary}</p>
      <div aria-hidden="true" className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDay}
              tick={AXIS_TEXT}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
              minTickGap={24}
            />
            <YAxis
              tick={AXIS_TEXT}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              tickFormatter={tickFormatter}
              width={52}
            />
            <Tooltip
              labelFormatter={(label) => formatDay(String(label))}
              formatter={(value) => [valueFormatter(Number(value)), seriesName]}
              contentStyle={{ background: 'var(--popover)', color: 'var(--popover-foreground)', border: '1px solid var(--border)', borderRadius: 8 }}
            />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

export default function SalesCharts({ series, days }: { series: AdminStatsSeriesPoint[]; days: number }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Orders per day"
          summary={describeSeries('orders', days, series)}
          dataKey="orders"
          color={ORDERS_COLOR}
          series={series}
          tickFormatter={(v) => String(v)}
          valueFormatter={(v) => String(v)}
          seriesName="Orders"
        />
        <ChartCard
          title="Revenue per day"
          summary={describeSeries('revenue', days, series)}
          dataKey="revenue"
          color={REVENUE_COLOR}
          series={series}
          tickFormatter={formatINRCompact}
          valueFormatter={formatINR}
          seriesName="Revenue"
        />
      </div>
      <details className="rounded-lg border bg-card p-3 text-sm">
        <summary className="cursor-pointer font-medium">View the data as a table</summary>
        <div className="mt-3 max-h-72 overflow-auto">
          <table className="w-full text-left">
            <caption className="sr-only">Orders and revenue for each of the last {days} days</caption>
            <thead>
              <tr className="border-b text-muted-foreground">
                <th scope="col" className="py-1 pr-4 font-medium">Date</th>
                <th scope="col" className="py-1 pr-4 text-right font-medium">Orders</th>
                <th scope="col" className="py-1 text-right font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {series.map((p) => (
                <tr key={p.date} className="border-b last:border-0">
                  <th scope="row" className="py-1 pr-4 font-normal">{formatDay(p.date)}</th>
                  <td className="py-1 pr-4 text-right tabular-nums">{p.orders}</td>
                  <td className="py-1 text-right tabular-nums">{formatINR(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
