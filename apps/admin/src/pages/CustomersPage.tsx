import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import Modal from '../components/ui/Modal';
import { TableSkeleton } from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { toast } from 'sonner';
import { Users, ShoppingBag, DollarSign, Calendar, Search, ShieldCheck, Mail, UserX, Eye } from 'lucide-react';

interface CustomerItem {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'admin' | 'supplier';
  is_active: boolean;
  created_at: string;
  orders_count?: number;
  total_spent?: number;
}

async function fetchCustomers(search = '') {
  const { data } = await api.get('/auth/users', { params: { role: 'customer', search } });
  return data.data as CustomerItem[];
}

async function fetchCustomerOrders(userId: number) {
  const { data } = await api.get('/orders', { params: { user_id: userId } });
  return data.data as any[];
}

export default function CustomersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => fetchCustomers(search),
  });

  const { data: customerOrders, isLoading: loadingOrders } = useQuery({
    queryKey: ['customer-orders', selectedCustomer?.id],
    queryFn: () => fetchCustomerOrders(selectedCustomer!.id),
    enabled: !!selectedCustomer,
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      api.patch(`/auth/users/${id}`, { is_active }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer status updated');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update customer status');
    },
  });

  const filteredCustomers = (customers ?? []).filter((c) => {
    if (statusFilter === 'active') return c.is_active;
    if (statusFilter === 'inactive') return !c.is_active;
    return true;
  });

  const totalCustomers = customers?.length ?? 0;
  const activeCount = customers?.filter((c) => c.is_active).length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            Customer Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Manage your registered customer accounts, order history, and account status
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Total Customers</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{totalCustomers}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl border bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Active Accounts</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{activeCount}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl border bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Verified Shoppers</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{totalCustomers}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search customers by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800/60 p-1 rounded-lg">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${statusFilter === 'all' ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
          >
            All ({totalCustomers})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${statusFilter === 'active' ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${statusFilter === 'inactive' ? 'bg-white dark:bg-zinc-900 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
          >
            Inactive ({totalCustomers - activeCount})
          </button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : filteredCustomers.length === 0 ? (
        <EmptyState
          title="No customers found"
          description={search ? `No customer matching "${search}"` : 'No customer records available'}
        />
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 text-2xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Email Address</th>
                  <th className="px-4 py-3">Registered On</th>
                  <th className="px-4 py-3">Account Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 text-sm">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                          {customer.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white leading-none">{customer.name}</p>
                          <p className="text-2xs text-slate-400 dark:text-zinc-500 mt-1">ID: #{customer.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-slate-600 dark:text-zinc-300 font-mono text-xs">
                      {customer.email}
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-zinc-400">
                      {new Date(customer.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-semibold ${customer.is_active ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${customer.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {customer.is_active ? 'Active Account' : 'Suspended'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedCustomer(customer)}
                          className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Orders
                        </button>
                        <button
                          onClick={() => toggleStatusMutation.mutate({ id: customer.id, is_active: !customer.is_active })}
                          className={`p-1.5 rounded-lg border text-xs transition-colors ${customer.is_active ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-800/40' : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40'}`}
                          title={customer.is_active ? 'Suspend Account' : 'Activate Account'}
                        >
                          {customer.is_active ? <UserX className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Orders Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedCustomer(null)}
          title={`Customer Order History — ${selectedCustomer.name}`}
        >
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{selectedCustomer.name}</p>
                <p className="text-slate-400 dark:text-zinc-500 font-mono mt-0.5">{selectedCustomer.email}</p>
              </div>
              <span className="px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold">
                Customer ID: #{selectedCustomer.id}
              </span>
            </div>

            {loadingOrders ? (
              <div className="py-8 text-center text-xs text-slate-400 animate-pulse">Loading customer orders...</div>
            ) : !customerOrders || customerOrders.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No orders placed by this customer yet.</div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {customerOrders.map((ord: any) => (
                  <div key={ord.id} className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {ord.order_number || `ORD-${ord.id}`}
                      </p>
                      <p className="text-slate-400 text-2xs mt-0.5">
                        {new Date(ord.created_at).toLocaleDateString()} • {ord.items?.length || 1} item(s)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900 dark:text-white">${Number(ord.total_amount).toFixed(2)}</p>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-2xs uppercase font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                        {ord.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
