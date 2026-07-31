import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import Modal from '../components/ui/Modal';
import { TableSkeleton } from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { toast } from 'sonner';
import {
  Users, Search, ShieldCheck, Mail, Edit2, Archive, KeyRound, Tag, AlertTriangle, ExternalLink
} from 'lucide-react';

interface TagItem {
  id: number;
  name: string;
}

interface CustomerItem {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  archived_at?: string | null;
  created_at: string;
  orders_count?: number;
  total_spent?: number;
  avg_order_value?: number;
  tags?: TagItem[];
}

async function fetchCustomers(search = '', tagId = '', includeArchived = false) {
  const params = new URLSearchParams();
  params.set('role', 'customer');
  if (search) params.set('search', search);
  if (tagId) params.set('tag_id', tagId);
  if (includeArchived) params.set('include_archived', 'true');

  const { data } = await api.get(`/auth/users?${params.toString()}`);
  return data.data as CustomerItem[];
}

async function fetchAllTags() {
  const { data } = await api.get('/auth/tags');
  return data.data as TagItem[];
}

export default function CustomersPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'archived'>('all');
  const [includeArchived, setIncludeArchived] = useState(false);

  // Active Modals for quick edit / archive
  const [editCustomer, setEditCustomer] = useState<CustomerItem | null>(null);
  const [archiveCustomer, setArchiveCustomer] = useState<CustomerItem | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '' });

  // Queries
  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers', search, tagFilter, includeArchived],
    queryFn: () => fetchCustomers(search, tagFilter, includeArchived),
  });

  const { data: availableTags } = useQuery({
    queryKey: ['tags'],
    queryFn: fetchAllTags,
  });

  // Mutations
  const updateCustomerMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: { name: string; email: string } }) =>
      api.patch(`/auth/users/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      setEditCustomer(null);
      toast.success('Customer details updated & audit log recorded');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update customer');
    },
  });

  const softArchiveMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/auth/users/${id}/archive`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      setArchiveCustomer(null);
      toast.success('Customer account soft-archived. Historical orders remain intact.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to archive customer');
    },
  });

  const sendPasswordResetMutation = useMutation({
    mutationFn: (id: number) => api.post(`/auth/users/${id}/reset-password`),
    onSuccess: (data: any) => {
      toast.success(data.data?.message || 'Password reset email triggered successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to trigger password reset email');
    },
  });

  // Handlers
  const openEdit = (cust: CustomerItem) => {
    setEditCustomer(cust);
    setEditForm({ name: cust.name, email: cust.email });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCustomer) return;
    updateCustomerMutation.mutate({ id: editCustomer.id, body: editForm });
  };

  // Filtered customer listing
  const filteredCustomers = (customers ?? []).filter((c) => {
    if (statusFilter === 'active') return c.is_active && !c.archived_at;
    if (statusFilter === 'suspended') return !c.is_active && !c.archived_at;
    if (statusFilter === 'archived') return !!c.archived_at;
    return true;
  });

  const totalCustomers = customers?.length ?? 0;
  const activeCount = customers?.filter((c) => c.is_active && !c.archived_at).length ?? 0;
  const archivedCount = customers?.filter((c) => !!c.archived_at).length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            Customer Directory & LTV Insights
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Manage customer accounts, lifetime metrics, append-only notes, and relational tags
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Total Directory Users</p>
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
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Soft-Archived</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{archivedCount}</p>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Relational Tag Filter */}
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-slate-400" />
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="py-2 px-3 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white"
          >
            <option value="">All Customer Tags</option>
            {(availableTags ?? []).map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Status Filters & Include Archived Toggle */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800/60 p-1 rounded-lg">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${statusFilter === 'all' ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${statusFilter === 'active' ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('suspended')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${statusFilter === 'suspended' ? 'bg-white dark:bg-zinc-900 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Suspended
            </button>
          </div>

          <button
            onClick={() => setIncludeArchived(!includeArchived)}
            className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${includeArchived ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 border-amber-300 dark:border-amber-800' : 'bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700'}`}
          >
            <Archive className="w-3.5 h-3.5" />
            {includeArchived ? 'Showing Archived' : 'Include Archived'}
          </button>
        </div>
      </div>

      {/* Directory Table */}
      {isLoading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : filteredCustomers.length === 0 ? (
        <EmptyState
          title="No customers found"
          description={search ? `No customer record matching "${search}"` : 'No customer records match your filter criteria'}
        />
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 text-2xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Tags</th>
                  <th className="px-4 py-3">Valid Orders</th>
                  <th className="px-4 py-3">LTV Total Spent</th>
                  <th className="px-4 py-3">Account Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 text-sm">
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    onClick={() => navigate(`/customers/${customer.id}`)}
                    className="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 cursor-pointer transition-colors group"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                          {customer.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 leading-none transition-colors">
                            {customer.name}
                          </p>
                          <p className="text-2xs text-slate-400 dark:text-zinc-500 mt-1 font-mono">{customer.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Tags column */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {customer.tags && customer.tags.length > 0 ? (
                          customer.tags.map((t) => (
                            <span key={t.id} className="px-2 py-0.5 rounded text-2xs font-medium bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                              {t.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-2xs text-slate-400 dark:text-zinc-500">—</span>
                        )}
                      </div>
                    </td>

                    {/* Valid Orders */}
                    <td className="px-4 py-3.5 font-medium text-slate-900 dark:text-white">
                      {customer.orders_count ?? 0} orders
                    </td>

                    {/* LTV Total Spent */}
                    <td className="px-4 py-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                      ${Number(customer.total_spent || 0).toFixed(2)}
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3.5">
                      {customer.archived_at ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                          <Archive className="w-3 h-3" /> Soft-Archived
                        </span>
                      ) : customer.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active Account
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Suspended
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/customers/${customer.id}`}
                          className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 flex items-center gap-1 transition-colors"
                          title="View Full Customer Detail Page"
                        >
                          View Detail <ExternalLink className="w-3 h-3" />
                        </Link>

                        <button
                          onClick={() => openEdit(customer)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                          title="Edit Customer Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {!customer.archived_at && (
                          <button
                            onClick={() => setArchiveCustomer(customer)}
                            className="p-1.5 rounded-lg border border-amber-200 dark:border-amber-800/40 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                            title="Archive Customer (Soft Delete)"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editCustomer && (
        <Modal
          isOpen={true}
          onClose={() => setEditCustomer(null)}
          title={`Edit Customer Details — ${editCustomer.name}`}
          size="md"
          footer={
            <>
              <button className="btn-secondary text-xs" onClick={() => setEditCustomer(null)}>Cancel</button>
              <button
                form="edit-customer-form"
                type="submit"
                className="btn-primary text-xs"
                disabled={updateCustomerMutation.isPending}
              >
                {updateCustomerMutation.isPending ? 'Saving...' : 'Save & Log Audit Record'}
              </button>
            </>
          }
        >
          <form id="edit-customer-form" onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1 text-slate-700 dark:text-zinc-300">Full Name *</label>
              <input
                className="input text-sm"
                required
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1 text-slate-700 dark:text-zinc-300">Email Address *</label>
              <input
                className="input text-sm font-mono"
                type="email"
                required
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
              <p className="text-2xs text-slate-400 dark:text-zinc-500 mt-1">
                Any modifications to Name or Email are automatically logged to audit_logs.
              </p>
            </div>

            {/* Password Reset Section */}
            <div className="pt-3 border-t border-slate-200 dark:border-zinc-800">
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">PASSWORD SECURITY</label>
              <p className="text-2xs text-slate-500 dark:text-zinc-400 mb-3">
                Admins cannot view or manually set raw passwords. Trigger a secure reset email flow instead.
              </p>
              <button
                type="button"
                onClick={() => sendPasswordResetMutation.mutate(editCustomer.id)}
                disabled={sendPasswordResetMutation.isPending}
                className="px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 flex items-center gap-2 transition-colors"
              >
                <KeyRound className="w-4 h-4" />
                {sendPasswordResetMutation.isPending ? 'Sending Link...' : 'Send Password Reset Email'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Archive Confirmation Modal */}
      {archiveCustomer && (
        <Modal
          isOpen={true}
          onClose={() => setArchiveCustomer(null)}
          title="Archive Customer Account"
          size="sm"
          footer={
            <>
              <button className="btn-secondary text-xs" onClick={() => setArchiveCustomer(null)}>Cancel</button>
              <button
                className="btn-danger text-xs bg-amber-600 hover:bg-amber-700 border-amber-700"
                onClick={() => softArchiveMutation.mutate(archiveCustomer.id)}
                disabled={softArchiveMutation.isPending}
              >
                {softArchiveMutation.isPending ? 'Archiving...' : 'Confirm Soft Archive'}
              </button>
            </>
          }
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600" />
              <p className="text-xs">
                Are you sure you want to soft-archive <strong>{archiveCustomer.name}</strong>?
              </p>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-400">
              This sets <code className="text-2xs bg-slate-100 dark:bg-zinc-800 p-1 rounded">is_active = false</code> and assigns <code className="text-2xs bg-slate-100 dark:bg-zinc-800 p-1 rounded">archived_at</code> timestamp. Historical orders remain 100% intact and queryable.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
