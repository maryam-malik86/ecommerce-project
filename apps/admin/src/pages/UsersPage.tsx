import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import Modal from '../components/ui/Modal';
import { TableSkeleton } from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { toast } from 'sonner';

interface UserItem {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'supplier' | 'customer';
  is_active: boolean;
  created_at: string;
  total_orders?: number;
  total_spent?: string;
}

async function fetchUsers(search: string, role: string) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (role) params.set('role', role);
  const { data } = await api.get(`/auth/users?${params}`);
  return data.data as UserItem[];
}

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: 'admin' as 'admin' | 'supplier' | 'customer',
  is_active: true,
};

export default function UsersPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'staff' | 'customers'>('staff');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editing, setEditing] = useState<UserItem | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: users, isLoading } = useQuery({
    queryKey: ['users', search],
    queryFn: () => fetchUsers(search, ''),
  });

  const createMutation = useMutation({
    mutationFn: (body: object) => api.post('/auth/users', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setModalOpen(false);
      toast.success('User account created successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create user');
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: object }) => api.patch(`/auth/users/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setModalOpen(false);
      toast.success('User account updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update user');
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/auth/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setDeleteId(null);
      toast.success('User account deleted');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    },
  });

  const openCreate = (defaultRole: 'admin' | 'supplier' | 'customer' = 'admin') => {
    setEditing(null);
    setForm({ ...emptyForm, role: defaultRole });
    setModalOpen(true);
  };

  const openEdit = (u: UserItem) => {
    setEditing(u);
    setForm({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      is_active: u.is_active,
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      const body: any = {
        name: form.name,
        role: form.role,
        is_active: form.is_active,
      };
      if (form.password) body.password = form.password;
      updateMutation.mutate({ id: editing.id, body });
    } else {
      createMutation.mutate({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const staffMembers = (users ?? []).filter((u) => u.role === 'admin' || u.role === 'supplier');
  const customersList = (users ?? []).filter((u) => u.role === 'customer');

  const currentList = (activeTab === 'staff' ? staffMembers : customersList).filter((u) =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--ui-fg-base)' }}>Users & Customers</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ui-fg-muted)' }}>
            Manage staff roles, administrative permissions, and customer accounts
          </p>
        </div>
        {activeTab === 'staff' ? (
          <button id="add-staff-btn" onClick={() => openCreate('admin')} className="btn-primary">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Staff Member
          </button>
        ) : (
          <button id="add-customer-btn" onClick={() => openCreate('customer')} className="btn-secondary">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Customer
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: 'var(--ui-border-base)' }}>
        <button
          id="tab-staff-members"
          onClick={() => setActiveTab('staff')}
          className="px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px flex items-center gap-2"
          style={{
            borderColor: activeTab === 'staff' ? 'var(--ui-accent)' : 'transparent',
            color: activeTab === 'staff' ? 'var(--ui-accent)' : 'var(--ui-fg-muted)',
          }}
        >
          <span>Staff Members</span>
          <span className="badge badge-purple">{staffMembers.length}</span>
        </button>
        <button
          id="tab-customers-list"
          onClick={() => setActiveTab('customers')}
          className="px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px flex items-center gap-2"
          style={{
            borderColor: activeTab === 'customers' ? 'var(--ui-accent)' : 'transparent',
            color: activeTab === 'customers' ? 'var(--ui-accent)' : 'var(--ui-fg-muted)',
          }}
        >
          <span>Customers</span>
          <span className="badge badge-neutral">{customersList.length}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="card p-3">
        <div className="relative">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ui-fg-muted)' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            id="user-search"
            className="input pl-9"
            placeholder={activeTab === 'staff' ? "Search staff by name or email…" : "Search customers by name or email…"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : !currentList.length ? (
          <EmptyState
            title={activeTab === 'staff' ? "No staff members found" : "No customers registered"}
            description={activeTab === 'staff' ? "Add staff members to assign system management permissions." : "Customer accounts will appear here when registered."}
            action={<button onClick={() => openCreate(activeTab === 'staff' ? 'admin' : 'customer')} className="btn-primary">Add {activeTab === 'staff' ? 'Staff Member' : 'Customer'}</button>}
            icon={
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ color: 'var(--ui-fg-muted)' }}>
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
            }
          />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {currentList.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                             style={{ background: u.role === 'admin' ? '#7c3aed' : u.role === 'supplier' ? '#2563eb' : '#4b5563' }}>
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold" style={{ color: 'var(--ui-fg-base)' }}>{u.name}</p>
                          <p className="text-xs" style={{ color: 'var(--ui-fg-muted)' }}>ID #{u.id}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--ui-fg-subtle)' }}>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-purple' : u.role === 'supplier' ? 'badge-blue' : 'badge-neutral'}`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`}>
                        {u.is_active ? '● Active' : '○ Disabled'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--ui-fg-muted)' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => openEdit(u)}
                          className="btn-ghost w-7 h-7 p-0 rounded"
                          title="Edit User"
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteId(u.id)}
                          className="btn-ghost w-7 h-7 p-0 rounded"
                          title="Delete User"
                          style={{ color: 'var(--ui-fg-error)' }}
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
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Account' : 'Create Account'}
        size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button
              id="user-save-btn"
              form="user-form"
              type="submit"
              className="btn-primary"
              disabled={isSaving}
            >
              {isSaving ? 'Saving…' : editing ? 'Save Changes' : 'Create Account'}
            </button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ui-fg-subtle)' }}>Full Name *</label>
            <input
              className="input"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. John Doe"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ui-fg-subtle)' }}>Email Address *</label>
            <input
              className="input"
              type="email"
              required
              disabled={!!editing}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="john@store.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ui-fg-subtle)' }}>
              {editing ? 'New Password (leave blank to keep current)' : 'Password *'}
            </label>
            <input
              className="input"
              type="password"
              required={!editing}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ui-fg-subtle)' }}>Role *</label>
              <select
                className="select"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as any })}
              >
                <option value="admin">Admin</option>
                <option value="supplier">Supplier</option>
                <option value="customer">Customer</option>
              </select>
            </div>
            {editing && (
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ui-fg-subtle)' }}>Status</label>
                <select
                  className="select"
                  value={form.is_active ? 'active' : 'inactive'}
                  onChange={(e) => setForm({ ...form, is_active: e.target.value === 'active' })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Disabled</option>
                </select>
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Delete Account"
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
            <button
              className="btn-danger"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </button>
          </>
        }
      >
        <p className="text-sm" style={{ color: 'var(--ui-fg-subtle)' }}>
          Are you sure you want to delete this account? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
