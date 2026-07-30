import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import api from '../services/api';
import type { ProfitSummary } from '@ecommerce/shared-types';

async function fetchProfit(from?: string, to?: string): Promise<ProfitSummary> {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const { data } = await api.get(`/analytics/profit?${params}`);
  return data.data;
}
async function fetchByProduct(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const { data } = await api.get(`/analytics/profit/by-product?${params}`);
  return data.data as Array<{
    product_id: number; product_name: string;
    revenue: string; cost: string; profit: string; orders: number;
  }>;
}
async function fetchTimeSeries(groupBy: string, from?: string, to?: string) {
  const params = new URLSearchParams({ groupBy });
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const { data } = await api.get(`/analytics/revenue/timeseries?${params}`);
  return data.data as Array<{ period: string; revenue: string; orders: number }>;
}

function StatBox({ label, value, subValue, color }: { label: string; value: string; subValue?: string; color: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-medium" style={{ color: 'var(--ui-fg-muted)' }}>{label}</p>
      <p className="text-2xl font-bold mt-1" style={{ color }}>{value}</p>
      {subValue && <p className="text-xs mt-0.5" style={{ color: 'var(--ui-fg-muted)' }}>{subValue}</p>}
    </div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium" style={{ color: 'var(--ui-fg-subtle)' }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>
            {typeof p.value === 'number' && (p.name.toLowerCase().includes('revenue') || p.name.toLowerCase().includes('profit') || p.name.toLowerCase().includes('cost'))
              ? `$${Number(p.value).toFixed(2)}` : p.value}
          </strong>
        </p>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const [from, setFrom] = useState(fmt(thirtyDaysAgo));
  const [to, setTo] = useState(fmt(today));
  const [groupBy, setGroupBy] = useState<'day' | 'month'>('day');

  const { data: profit, isLoading: lp } = useQuery({
    queryKey: ['analytics-profit', from, to],
    queryFn: () => fetchProfit(from, to),
  });
  const { data: byProduct, isLoading: lbp } = useQuery({
    queryKey: ['analytics-by-product', from, to],
    queryFn: () => fetchByProduct(from, to),
  });
  const { data: timeSeries, isLoading: lts } = useQuery({
    queryKey: ['analytics-timeseries', from, to, groupBy],
    queryFn: () => fetchTimeSeries(groupBy, from, to),
  });

  const tsChartData = (timeSeries ?? []).map((d) => ({
    period: groupBy === 'day' ? d.period.slice(5) : d.period.slice(0, 7),
    revenue: parseFloat(d.revenue),
    orders: d.orders,
  }));

  const productChartData = (byProduct ?? [])
    .sort((a, b) => parseFloat(b.revenue) - parseFloat(a.revenue))
    .slice(0, 10)
    .map((p) => ({
      name: p.product_name.length > 15 ? p.product_name.slice(0, 15) + '…' : p.product_name,
      revenue: parseFloat(p.revenue),
      profit: parseFloat(p.profit),
      cost: parseFloat(p.cost),
    }));

  const margin = profit
    ? (Number(profit.net_profit) / Number(profit.total_revenue) * 100).toFixed(1)
    : '—';

  return (
    <div className="space-y-6">
      {/* Header + Date filters */}
      <div className="flex flex-wrap items-end gap-4 justify-between">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--ui-fg-base)' }}>Analytics</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ui-fg-muted)' }}>
            Revenue, profit & product performance
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium" style={{ color: 'var(--ui-fg-muted)' }}>From</label>
            <input id="analytics-from" type="date" className="input w-36" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium" style={{ color: 'var(--ui-fg-muted)' }}>To</label>
            <input id="analytics-to" type="date" className="input w-36" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <select id="group-by" className="select w-28" value={groupBy} onChange={(e) => setGroupBy(e.target.value as any)}>
            <option value="day">Daily</option>
            <option value="month">Monthly</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      {lp ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-3 rounded w-20 mb-3" style={{ background: 'var(--ui-bg-component)' }} />
              <div className="h-7 rounded w-28" style={{ background: 'var(--ui-bg-component)' }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatBox label="Total Revenue" value={`$${Number(profit?.total_revenue ?? 0).toFixed(2)}`} color="var(--ui-accent)" />
          <StatBox label="Net Profit" value={`$${Number(profit?.net_profit ?? 0).toFixed(2)}`} color="#16a34a" />
          <StatBox label="Total Orders" value={String(profit?.total_orders ?? 0)} color="#2563eb" />
          <StatBox label="Profit Margin" value={`${margin}%`} subValue="Revenue → Profit" color="#ea580c" />
        </div>
      )}

      {/* Revenue / Orders time series */}
      <div className="card p-5">
        <div className="section-header">
          <h2 className="section-title">Revenue Over Time</h2>
          <span className="badge badge-purple">{groupBy === 'day' ? 'Daily' : 'Monthly'}</span>
        </div>
        {lts ? (
          <div className="h-60 animate-pulse rounded-lg" style={{ background: 'var(--ui-bg-component)' }} />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={tsChartData}>
              <defs>
                <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--ui-accent)" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="var(--ui-accent)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ui-border-base)" />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: 'var(--ui-fg-muted)' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--ui-fg-muted)' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" name="Revenue ($)" stroke="var(--ui-accent)" strokeWidth={2} fill="url(#revGrad2)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Profit by Product */}
      <div className="card p-5">
        <div className="section-header">
          <h2 className="section-title">Top Products by Revenue</h2>
          <span className="badge badge-neutral">Top 10</span>
        </div>
        {lbp ? (
          <div className="h-60 animate-pulse rounded-lg" style={{ background: 'var(--ui-bg-component)' }} />
        ) : !productChartData.length ? (
          <p className="text-sm py-8 text-center" style={{ color: 'var(--ui-fg-muted)' }}>No product data for this period</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={productChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ui-border-base)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--ui-fg-muted)' }} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--ui-fg-muted)' }} tickLine={false} width={100} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="revenue" name="Revenue ($)" fill="var(--ui-accent)" radius={[0,3,3,0]} />
              <Bar dataKey="profit" name="Profit ($)" fill="#16a34a" radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Product breakdown table */}
      {!lbp && byProduct && byProduct.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--ui-border-base)' }}>
            <h2 className="section-title">Product Breakdown</h2>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Orders</th>
                  <th>Revenue</th>
                  <th>Cost</th>
                  <th>Profit</th>
                  <th>Margin</th>
                </tr>
              </thead>
              <tbody>
                {byProduct.map((p) => {
                  const margin = Number(p.revenue) > 0
                    ? (Number(p.profit) / Number(p.revenue) * 100).toFixed(1)
                    : '0.0';
                  return (
                    <tr key={p.product_id}>
                      <td className="font-medium" style={{ color: 'var(--ui-fg-base)' }}>{p.product_name}</td>
                      <td style={{ color: 'var(--ui-fg-subtle)' }}>{p.orders}</td>
                      <td className="font-medium">${Number(p.revenue).toFixed(2)}</td>
                      <td style={{ color: 'var(--ui-fg-muted)' }}>${Number(p.cost).toFixed(2)}</td>
                      <td style={{ color: '#16a34a' }} className="font-medium">${Number(p.profit).toFixed(2)}</td>
                      <td>
                        <span className={`badge ${Number(margin) >= 30 ? 'badge-green' : Number(margin) >= 15 ? 'badge-orange' : 'badge-red'}`}>
                          {margin}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
