import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import Modal from '../components/ui/Modal';
import { TableSkeleton } from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { toast } from 'sonner';
import {
  ArrowLeft, Users, ShieldCheck, Mail, Edit2, KeyRound, Archive, Tag, Plus,
  StickyNote, ShoppingBag, ExternalLink, Calendar, AlertTriangle
} from 'lucide-react';

interface TagItem {
  id: number;
  name: string;
}

interface CustomerNote {
  id: number;
  customer_id: number;
  author_admin_id?: number | null;
  note: string;
  created_at: string;
  author_name?: string;
}

interface CustomerDetail {
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

async function fetchCustomerById(id: string): Promise<CustomerDetail> {
  const { data } = await api.get(`/auth/users`);
  const users = data.data as CustomerDetail[];
  const found = users.find((u) => u.id === Number(id));
  if (!found) throw new Error('Customer not found');
  return found;
}

async function fetchCustomerOrders(userId: string) {
  const { data } = await api.get('/orders', { params: { user_id: userId } });
  return data.data as any[];
}

async function fetchCustomerNotes(userId: string) {
  const { data } = await api.get(`/auth/users/${userId}/notes`);
  return data.data as CustomerNote[];
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Local state for modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '' });
  const [newNote, setNewNote] = useState('');
  const [newTagName, setNewTagName] = useState('');

  // Queries
  const { data: customer, isLoading, isError } = useQuery({
    queryKey: ['customer-detail', id],
    queryFn: () => fetchCustomerById(id!),
    enabled: !!id,
  });

  const { data: customerOrders, isLoading: loadingOrders } = useQuery({
    queryKey: ['customer-orders', id],
    queryFn: () => fetchCustomerOrders(id!),
    enabled: !!id,
  });

  const { data: customerNotes, isLoading: loadingNotes } = useQuery({
    queryKey: ['customer-notes', id],
    queryFn: () => fetchCustomerNotes(id!),
    enabled: !!id,
  });

  // Mutations
  const updateCustomerMutation = useMutation({
    mutationFn: (body: { name: string; email: string }) =>
      api.patch(`/auth/users/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer-detail', id] });
      qc.invalidateQueries({ queryKey: ['customers'] });
      setEditModalOpen(false);
      toast.success('Customer details updated & audit record logged');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update customer');
    },
  });

  const softArchiveMutation = useMutation({
    mutationFn: () => api.patch(`/auth/users/${id}/archive`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer-detail', id] });
      qc.invalidateQueries({ queryKey: ['customers'] });
      setArchiveModalOpen(false);
      toast.success('Customer account soft-archived. Historical orders remain intact.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to archive customer');
    },
  });

  const sendPasswordResetMutation = useMutation({
    mutationFn: () => api.post(`/auth/users/${id}/reset-password`),
    onSuccess: (data: any) => {
      toast.success(data.data?.message || 'Password reset link generated & sent');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to trigger reset email');
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: (note: string) => api.post(`/auth/users/${id}/notes`, { note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer-notes', id] });
      setNewNote('');
      toast.success('Immutable customer note recorded');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to add note');
    },
  });

  const addTagMutation = useMutation({
    mutationFn: (name: string) => api.post(`/auth/users/${id}/tags`, { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer-detail', id] });
      qc.invalidateQueries({ queryKey: ['customers'] });
      setNewTagName('');
      toast.success('Tag attached to customer');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to attach tag');
    },
  });

  const removeTagMutation = useMutation({
    mutationFn: (tagId: number) => api.delete(`/auth/users/${id}/tags/${tagId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer-detail', id] });
      qc.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Tag removed');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to remove tag');
    },
  });

  const openEditModal = () => {
    if (!customer) return;
    setEditForm({ name: customer.name, email: customer.email });
    setEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCustomerMutation.mutate(editForm);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    addNoteMutation.mutate(newNote);
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    addTagMutation.mutate(newTagName);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
        <TableSkeleton rows={6} cols={4} />
      </div>
    );
  }

  if (isError || !customer) {
    return (
      <div className="space-y-4">
        <Link to="/customers" className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Customer Directory
        </Link>
        <EmptyState
          title="Customer record not found"
          description="The requested customer profile could not be retrieved."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/customers"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Customer Directory
        </Link>
        <span className="text-2xs font-mono text-slate-400 dark:text-zinc-500">
          ID: #{customer.id}
        </span>
      </div>

      {/* Customer Header Banner */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white font-bold text-xl flex items-center justify-center shadow-lg">
            {customer.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {customer.name}
              </h1>
              {customer.archived_at ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-200 dark:border-amber-800">
                  <Archive className="w-3 h-3" /> Soft-Archived
                </span>
              ) : customer.is_active ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active Account
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-200 dark:border-rose-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Suspended
                </span>
              )}
            </div>
            <p className="text-sm font-mono text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" /> {customer.email}
            </p>
            <p className="text-2xs text-slate-400 dark:text-zinc-500 mt-1 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" /> Registered: {new Date(customer.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={openEditModal}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-zinc-700 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Edit2 className="w-3.5 h-3.5 text-indigo-500" /> Edit Details
          </button>

          <button
            onClick={() => sendPasswordResetMutation.mutate()}
            disabled={sendPasswordResetMutation.isPending}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <KeyRound className="w-3.5 h-3.5" />
            {sendPasswordResetMutation.isPending ? 'Sending...' : 'Send Password Reset Email'}
          </button>

          {!customer.archived_at && (
            <button
              onClick={() => setArchiveModalOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Archive className="w-3.5 h-3.5" /> Archive Account
            </button>
          )}
        </div>
      </div>

      {/* Lifetime Value (LTV) Performance Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <p className="text-2xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Valid Orders Count</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {customer.orders_count ?? 0} <span className="text-xs font-normal text-slate-400">orders</span>
          </p>
          <p className="text-2xs text-slate-400 dark:text-zinc-500 mt-1">Excludes cancelled orders</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <p className="text-2xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Net Lifetime Spent</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            ${Number(customer.total_spent || 0).toFixed(2)}
          </p>
          <p className="text-2xs text-slate-400 dark:text-zinc-500 mt-1">Subtracts refunded amounts</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <p className="text-2xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Average Order Value (AOV)</p>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            ${Number(customer.avg_order_value || 0).toFixed(2)}
          </p>
          <p className="text-2xs text-slate-400 dark:text-zinc-500 mt-1">Net Spent / Valid Orders</p>
        </div>
      </div>

      {/* 2-Column Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (1/3) — Tags & Notes */}
        <div className="space-y-6">
          {/* Relational Customer Tags Card */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
            <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-indigo-500" /> Relational Customer Tags
            </h2>

            <div className="flex flex-wrap gap-1.5">
              {customer.tags && customer.tags.length > 0 ? (
                customer.tags.map((t) => (
                  <span key={t.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700">
                    {t.name}
                    <button
                      onClick={() => removeTagMutation.mutate(t.id)}
                      className="text-slate-400 hover:text-rose-500 transition-colors"
                      title="Remove tag"
                    >
                      ×
                    </button>
                  </span>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No tags assigned yet.</p>
              )}
            </div>

            <form onSubmit={handleAddTag} className="flex gap-2">
              <input
                type="text"
                placeholder="Add tag (e.g. VIP, Wholesale)..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white"
              />
              <button type="submit" disabled={addTagMutation.isPending} className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </form>
          </div>

          {/* Append-Only Notes Timeline Card */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
            <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-indigo-500" /> Immutable Notes Timeline
            </h2>

            <form onSubmit={handleAddNote} className="space-y-2">
              <textarea
                rows={3}
                placeholder="Record an immutable note for this customer..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                type="submit"
                disabled={addNoteMutation.isPending || !newNote.trim()}
                className="btn-primary text-xs w-full py-2 flex items-center justify-center gap-1.5"
              >
                <StickyNote className="w-3.5 h-3.5" /> Record Note
              </button>
            </form>

            {loadingNotes ? (
              <div className="py-4 text-center text-xs text-slate-400 animate-pulse">Loading notes...</div>
            ) : !customerNotes || customerNotes.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2 text-center">No notes recorded yet.</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {customerNotes.map((note) => (
                  <div key={note.id} className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-2xs text-slate-400 dark:text-zinc-500 border-b border-slate-100 dark:border-zinc-800/80 pb-1">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {note.author_name || 'System Admin'}
                      </span>
                      <span>{new Date(note.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-800 dark:text-zinc-200 leading-relaxed">{note.note}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (2/3) — Full Interactive Order History Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-indigo-500" /> Order History ({customerOrders?.length ?? 0})
                </h2>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                  Click any order row to open its full dedicated inspection page (`/orders/:id`)
                </p>
              </div>
            </div>

            {loadingOrders ? (
              <TableSkeleton rows={5} cols={4} />
            ) : !customerOrders || customerOrders.length === 0 ? (
              <EmptyState title="No orders placed yet" description="This customer has not placed any purchases on the store." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 text-2xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                      <th className="px-4 py-3">Order Number</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Fulfillment Status</th>
                      <th className="px-4 py-3">Total Amount</th>
                      <th className="px-4 py-3 text-right">View Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 text-sm">
                    {customerOrders.map((ord: any) => (
                      <tr
                        key={ord.id}
                        onClick={() => navigate(`/orders/${ord.id}`)}
                        className="hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 cursor-pointer transition-colors group"
                      >
                        <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          Order #{ord.id}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-zinc-400">
                          {new Date(ord.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-2xs font-semibold uppercase ${ord.status === 'cancelled' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'}`}>
                            {ord.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                          ${Number(ord.total_amount).toFixed(2)}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:underline">
                            Inspect Order <ExternalLink className="w-3 h-3" />
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Customer Modal */}
      {editModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setEditModalOpen(false)}
          title={`Edit Customer Details — ${customer.name}`}
          size="md"
          footer={
            <>
              <button className="btn-secondary text-xs" onClick={() => setEditModalOpen(false)}>Cancel</button>
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
                Any modifications to Name or Email are automatically logged to the audit_logs table.
              </p>
            </div>
          </form>
        </Modal>
      )}

      {/* Soft Archive Confirmation Modal */}
      {archiveModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setArchiveModalOpen(false)}
          title="Archive Customer Account"
          size="sm"
          footer={
            <>
              <button className="btn-secondary text-xs" onClick={() => setArchiveModalOpen(false)}>Cancel</button>
              <button
                className="btn-danger text-xs bg-amber-600 hover:bg-amber-700 border-amber-700"
                onClick={() => softArchiveMutation.mutate()}
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
                Are you sure you want to soft-archive <strong>{customer.name}</strong>?
              </p>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-400">
              This sets <code className="text-2xs bg-slate-100 dark:bg-zinc-800 p-1 rounded">is_active = false</code> and records <code className="text-2xs bg-slate-100 dark:bg-zinc-800 p-1 rounded">archived_at</code> timestamp. Historical orders remain 100% intact and queryable.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
