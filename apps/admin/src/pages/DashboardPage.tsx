import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import type { ProfitSummary } from '@ecommerce/shared-types';

async function fetchProfitSummary(): Promise<ProfitSummary> {
  const { data } = await api.get('/analytics/profit');
  return data.data;
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ['profit-summary'], queryFn: fetchProfitSummary });

  const stats = [
    { label: 'Net Profit', value: data ? `$${data.net_profit.toFixed(2)}` : '—', color: 'text-emerald-400' },
    { label: 'Total Revenue', value: data ? `$${data.total_revenue.toFixed(2)}` : '—', color: 'text-sky-400' },
    { label: 'Total Orders', value: data?.total_orders ?? '—', color: 'text-purple-400' },
    { label: 'Avg Order Value', value: data ? `$${data.avg_order_value.toFixed(2)}` : '—', color: 'text-amber-400' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>
      {isLoading ? (
        <p className="text-slate-400">Loading stats...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="card">
              <p className="text-sm text-slate-400">{stat.label}</p>
              <p className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
