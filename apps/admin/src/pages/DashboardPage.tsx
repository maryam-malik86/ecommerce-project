import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import api from '../services/api';
import type { ProfitSummary } from '@ecommerce/shared-types';
import { TableSkeleton } from '../components/ui/Spinner';
import { OrderStatusBadge } from '../components/ui/Badge';

async function fetchProfitSummary(): Promise<ProfitSummary> {
  const { data } = await api.get('/analytics/profit');
  return data.data;
}
async function fetchTimeSeries() {
  const { data } = await api.get('/analytics/revenue/timeseries?groupBy=day');
  return data.data as Array<{ period: string; revenue: string; orders: number }>;
}
async function fetchRecentOrders() {
  const { data } = await api.get('/orders?limit=5');
  return data.data as Array<{
    id: number; status: string; payment_status: string;
    total_amount: string; created_at: string;
    user_name?: string; user_email?: string;
  }>;
}

function StatCard({ label, value, change, color, icon }: {
  label: string; value: string; change?: string; color: string; icon: React.ReactNode;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: 'var(--ui-fg-muted)' }}>{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: color + '20', color }}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold mt-1" style={{ color: 'var(--ui-fg-base)' }}>{value}</p>
      {change && (
        <p className="text-xs" style={{ color: 'var(--ui-fg-muted)' }}>{change}</p>
      )}
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 text-xs shadow-lg">
      <p style={{ color: 'var(--ui-fg-muted)' }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{typeof p.value === 'number' && p.name.toLowerCase().includes('revenue')
            ? `$${p.value.toFixed(2)}` : p.value}</strong>
        </p>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { data: profit, isLoading: loadingProfit } = useQuery({
    queryKey: ['profit-summary'],
    queryFn: fetchProfitSummary,
  });
  const { data: timeSeries, isLoading: loadingTS } = useQuery({
    queryKey: ['timeseries'],
    queryFn: fetchTimeSeries,
  });
  const { data: recentOrders, isLoading: loadingOrders } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: fetchRecentOrders,
  });

  const stats = [
    {
      label: 'Net Profit',
      value: profit ? `$${Number(profit.net_profit).toFixed(2)}` : '—',
      color: '#16a34a',
      icon: (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
          <polyline points="17 6 23 6 23 12"/>
        </svg>
      ),
    },
    {
      label: 'Total Revenue',
      value: profit ? `$${Number(profit.total_revenue).toFixed(2)}` : '—',
      color: '#7c3aed',
      icon: (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
        </svg>
      ),
    },
    {
      label: 'Total Orders',
      value: profit ? String(profit.total_orders) : '—',
      color: '#2563eb',
      icon: (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
          <rect x="9" y="3" width="6" height="4" rx="1"/>
        </svg>
      ),
    },
    {
      label: 'Avg Order Value',
      value: profit ? `$${Number(profit.avg_order_value).toFixed(2)}` : '—',
      color: '#ea580c',
      icon: (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M12 20V10M18 20V4M6 20v-4"/>
        </svg>
      ),
    },
  ];

  const chartData = (timeSeries ?? []).map((d) => ({
    date: d.period.slice(5),
    revenue: parseFloat(d.revenue),
    orders: d.orders,
  }));

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--ui-fg-base)' }}>Dashboard</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--ui-fg-muted)' }}>
          Here's what's happening with your store today.
        </p>
      </div>

      {/* Stats */}
      {loadingProfit ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => (
            <div key={i} className="stat-card animate-pulse">
              <div className="h-4 rounded w-24" style={{ background: 'var(--ui-bg-component)' }} />
              <div className="h-8 rounded w-32 mt-2" style={{ background: 'var(--ui-bg-component)' }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue chart — 2/3 width */}
        <div className="card p-5 lg:col-span-2">
          <div className="section-header">
            <h2 className="section-title">Revenue Over Time</h2>
            <span className="badge badge-purple">Last 30 days</span>
          </div>
          {loadingTS ? (
            <div className="h-52 animate-pulse rounded-lg" style={{ background: 'var(--ui-bg-component)' }} />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--ui-accent)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--ui-accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--ui-border-base)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--ui-fg-muted)' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--ui-fg-muted)' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="var(--ui-accent)" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Orders chart — 1/3 width */}
        <div className="card p-5">
          <div className="section-header">
            <h2 className="section-title">Daily Orders</h2>
          </div>
          {loadingTS ? (
            <div className="h-52 animate-pulse rounded-lg" style={{ background: 'var(--ui-bg-component)' }} />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--ui-border-base)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--ui-fg-muted)' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--ui-fg-muted)' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="orders" name="Orders" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b"
             style={{ borderColor: 'var(--ui-border-base)' }}>
          <h2 className="section-title">Recent Orders</h2>
          <a href="/orders" className="text-xs font-medium" style={{ color: 'var(--ui-accent)' }}>
            View all →
          </a>
        </div>
        {loadingOrders ? (
          <TableSkeleton rows={5} cols={5} />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {(recentOrders ?? []).slice(0, 5).map((order) => (
                  <tr key={order.id}>
                    <td className="font-medium" style={{ color: 'var(--ui-accent)' }}>#{order.id}</td>
                    <td>{order.user_name || order.user_email || '—'}</td>
                    <td><OrderStatusBadge status={order.status} /></td>
                    <td>
                      <span className={`badge ${order.payment_status === 'paid' ? 'badge-green' : 'badge-orange'}`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="font-medium">${Number(order.total_amount).toFixed(2)}</td>
                    <td style={{ color: 'var(--ui-fg-muted)' }}>
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {(!recentOrders || recentOrders.length === 0) && (
                  <tr>
                    <td colSpan={6} className="text-center py-8" style={{ color: 'var(--ui-fg-muted)' }}>
                      No orders yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
