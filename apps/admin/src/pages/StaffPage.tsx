import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Modal from '../components/ui/Modal';
import { TableSkeleton } from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { toast } from 'sonner';
import { ShieldCheck, UserPlus, Trash2, Edit2, ShieldAlert, Award, KeyRound, CheckCircle2 } from 'lucide-react';

interface StaffUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'supplier' | 'customer';
  is_active: boolean;
  created_at: string;
}

async function fetchStaffUsers() {
  const { data } = await api.get('/auth/users');
  // Filter out customers — staff only
  return (data.data as StaffUser[]).filter((u) => u.role === 'admin' || u.role === 'supplier');
}

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: 'admin' as 'admin' | 'supplier',
};

const ROLE_PERMISSIONS_MAP = {
  admin: [
    { label: 'Catalog & Products', scope: 'Full Access' },
    { label: 'Orders & Refunds', scope: 'Full Access' },
    { label: 'Inventory & Suppliers', scope: 'Full Access' },
    { label: 'Customer Directory', scope: 'Full Access' },
    { label: 'System Settings & Staff', scope: 'Full Access' },
    { label: 'Roles & Permissions', scope: 'Full Access' },
  ],
  supplier: [
    { label: 'Catalog & Products', scope: 'Manage Catalog' },
    { label: 'Inventory & Stock', scope: 'Adjust Stock' },
    { label: 'Order Processing', scope: 'View & Process' },
    { label: 'Customer Directory', scope: 'View Only' },
  ],
};

export default function StaffPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StaffUser | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: staffList, isLoading } = useQuery({
    queryKey: ['staff-users'],
    queryFn: fetchStaffUsers,
  });

  const createMutation = useMutation({
    mutationFn: (body: object) => api.post('/auth/users', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff-users'] });
      setModalOpen(false);
      toast.success('Staff member added successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to add staff member');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: object }) => api.patch(`/auth/users/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff-users'] });
      setModalOpen(false);
      toast.success('Staff member updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update staff member');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/auth/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff-users'] });
      setDeleteId(null);
      toast.success('Staff member removed');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to remove staff member');
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (u: StaffUser) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role as 'admin' | 'supplier' });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      name: form.name,
      email: form.email,
      role: form.role,
      ...(form.password && { password: form.password }),
    };
    if (editing) updateMutation.mutate({ id: editing.id, body });
    else createMutation.mutate(body);
  };

  const totalStaff = staffList?.length ?? 0;
  const adminCount = staffList?.filter((s) => s.role === 'admin').length ?? 0;
  const managerCount = staffList?.filter((s) => s.role === 'supplier').length ?? 0;

  const currentRolePermissions = ROLE_PERMISSIONS_MAP[form.role] || ROLE_PERMISSIONS_MAP.admin;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-500" />
            System Staff Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Configure system administrators, store managers, roles, and granular security permissions
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> Add Staff Member
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Total System Staff</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{totalStaff}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl border bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Administrators</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{adminCount}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl border bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Store Managers</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{managerCount}</p>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      {isLoading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : !staffList || staffList.length === 0 ? (
        <EmptyState title="No staff members" description="Click Add Staff Member to invite your first admin." />
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 text-2xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  <th className="px-4 py-3">Staff Member</th>
                  <th className="px-4 py-3">Email Address</th>
                  <th className="px-4 py-3">System Role</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 text-sm">
                {staffList.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-900 dark:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                          {staff.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white leading-none">{staff.name}</p>
                          <p className="text-2xs text-slate-400 dark:text-zinc-500 mt-1">ID: #{staff.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-slate-600 dark:text-zinc-300 font-mono text-xs">
                      {staff.email}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-semibold uppercase tracking-wider ${staff.role === 'admin' ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'}`}>
                        {staff.role === 'admin' ? 'Administrator' : 'Store Manager'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(staff)}
                          className="btn-ghost w-7 h-7 p-0 rounded flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                          title="Edit Staff Member"
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteId(staff.id)}
                          className="btn-ghost w-7 h-7 p-0 rounded flex items-center justify-center text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Remove Staff Member"
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14H6L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                            <path d="M9 6V4h6v2"/>
                          </svg>
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

      {/* Add / Edit Staff Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editing ? 'Edit System Staff Member' : 'Add New System Staff Member'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Sarah Connor"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="sarah@store.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Password {editing && '(leave blank to keep unchanged)'}
              </label>
              <input
                type="password"
                required={!editing}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Assigned System Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as any })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="admin">Super Administrator (Full System Access)</option>
                <option value="supplier">Store Manager (Catalog & Operations)</option>
              </select>
            </div>

            {/* Inherited Role Permissions Summary Card */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
                  Inherited Role Permissions
                </span>
                <span className="text-2xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {currentRolePermissions.length} Active Scopes
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {currentRolePermissions.map((perm, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-2xs text-slate-700 dark:text-zinc-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                    <span className="truncate">{perm.label}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-700/50 text-2xs text-slate-400 dark:text-zinc-500 flex items-center justify-between">
                <span>Centralized Security Control</span>
                <Link to="/system/roles" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                  Manage Roles & Permissions &rarr;
                </Link>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost">
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                {editing ? 'Save Changes' : 'Create Staff Member'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <Modal isOpen={true} onClose={() => setDeleteId(null)} title="Remove Staff Member">
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-zinc-300">
              Are you sure you want to remove this staff account? They will lose all access to the admin dashboard.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setDeleteId(null)} className="btn-ghost">Cancel</button>
              <button onClick={() => deleteMutation.mutate(deleteId)} className="btn-danger">Remove</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
