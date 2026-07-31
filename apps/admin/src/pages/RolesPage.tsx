import { useState } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  CheckCircle2,
  Lock,
  Boxes,
  ShoppingBag,
  Sliders,
  BarChart3,
  Mail,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  SYSTEM_PERMISSIONS,
  useDynamicRoles,
  saveRoles,
  type RoleGroup,
  type PermissionItem,
} from '../services/roles';

export { SYSTEM_PERMISSIONS };
export type { RoleGroup, PermissionItem };

export default function RolesPage() {
  const roles = useDynamicRoles();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleGroup | null>(null);

  // Form State
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [badgeColor, setBadgeColor] = useState('indigo');

  const filteredRoles = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingRole(null);
    setRoleName('');
    setRoleDesc('');
    setBadgeColor('indigo');
    setSelectedPermissions([
      'products.view',
      'orders.view',
      'customers.view',
    ]);
    setModalOpen(true);
  };

  const openEditModal = (role: RoleGroup) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDesc(role.description);
    setBadgeColor(role.badgeColor);
    setSelectedPermissions([...role.permissions]);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      toast.error('Permission group name is required');
      return;
    }

    if (editingRole) {
      const updated = roles.map((r) =>
        r.id === editingRole.id
          ? {
              ...r,
              name: roleName,
              description: roleDesc,
              badgeColor,
              permissions: selectedPermissions,
            }
          : r
      );
      saveRoles(updated);
      toast.success(`Permission group "${roleName}" updated successfully`);
    } else {
      const roleId = roleName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || `role_${Date.now()}`;
      const newRole: RoleGroup = {
        id: roleId,
        name: roleName,
        description: roleDesc || 'Custom operational permission group',
        isSystem: false,
        memberCount: 0,
        badgeColor,
        permissions: selectedPermissions,
      };
      saveRoles([...roles, newRole]);
      toast.success(`Permission group "${roleName}" created successfully`);
    }

    setModalOpen(false);
  };

  const handleDelete = (role: RoleGroup) => {
    if (role.isSystem) {
      toast.error('System built-in roles cannot be removed');
      return;
    }
    if (confirm(`Are you sure you want to delete "${role.name}"?`)) {
      const updated = roles.filter((r) => r.id !== role.id);
      saveRoles(updated);
      toast.success(`Role group "${role.name}" removed`);
    }
  };

  const togglePermission = (code: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const selectCategoryAll = (category: string) => {
    const categoryCodes = SYSTEM_PERMISSIONS.filter((p) => p.category === category).map((p) => p.code);
    const allSelected = categoryCodes.every((code) => selectedPermissions.includes(code));

    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((code) => !categoryCodes.includes(code)));
    } else {
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...categoryCodes])));
    }
  };

  const categories: Array<'Catalog' | 'Orders' | 'Customers' | 'System' | 'Analytics'> = [
    'Catalog',
    'Orders',
    'Customers',
    'System',
    'Analytics',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-indigo-500" />
            Roles & Permission Groups
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Define access levels, granular security controls, and permission groups for store administrators and staff
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="btn-primary inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Permission Group
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Total Permission Groups
            </p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{roles.length}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Assigned Staff Members
            </p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              {roles.reduce((acc, r) => acc + r.memberCount, 0)}
            </p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Granular System Permissions
            </p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              {SYSTEM_PERMISSIONS.length}
            </p>
          </div>
        </div>
      </div>

      {/* Filter / Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search permission groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* Permission Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRoles.map((role) => (
          <div
            key={role.id}
            className="card p-5 flex flex-col justify-between space-y-4 hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs ${
                      role.badgeColor === 'purple'
                        ? 'bg-purple-600'
                        : role.badgeColor === 'emerald'
                        ? 'bg-emerald-600'
                        : role.badgeColor === 'blue'
                        ? 'bg-blue-600'
                        : 'bg-indigo-600'
                    }`}
                  >
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {role.name}
                      {role.isSystem && (
                        <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                          System Default
                        </span>
                      )}
                    </h3>
                    <p className="text-2xs text-slate-400 dark:text-zinc-500 mt-0.5">
                      {role.memberCount} Staff Member{role.memberCount !== 1 ? 's' : ''} assigned
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(role)}
                    className="btn-ghost w-7 h-7 p-0 rounded flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                    title="Edit Role"
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  {!role.isSystem && (
                    <button
                      onClick={() => handleDelete(role)}
                      className="btn-ghost w-7 h-7 p-0 rounded flex items-center justify-center text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete Group"
                    >
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14H6L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                        <path d="M9 6V4h6v2"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-zinc-400 mt-3 leading-relaxed">
                {role.description}
              </p>

              {/* Permission Badges */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <p className="text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">
                  Granted Permissions ({role.permissions.length} of {SYSTEM_PERMISSIONS.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {role.permissions.map((permCode) => {
                    const permObj = SYSTEM_PERMISSIONS.find((p) => p.code === permCode);
                    return (
                      <span
                        key={permCode}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-medium bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700/60"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                        {permObj?.label || permCode}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Create / Edit Permission Group */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="card max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-indigo-500" />
                {editingRole ? `Edit "${editingRole.name}"` : 'Create New Permission Group'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 text-xs font-semibold px-2 py-1 rounded-md"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Catalog Specialist"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Badge Theme Color
                  </label>
                  <select
                    value={badgeColor}
                    onChange={(e) => setBadgeColor(e.target.value)}
                    className="select w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="indigo">Indigo Accent</option>
                    <option value="purple">Purple Royal</option>
                    <option value="emerald">Emerald Success</option>
                    <option value="blue">Ocean Blue</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Description & Scope
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe the operational responsibilities of members in this permission group..."
                  value={roleDesc}
                  onChange={(e) => setRoleDesc(e.target.value)}
                  className="textarea w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Granular Permission Checklist */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Configure Permissions ({selectedPermissions.length} selected)
                  </label>
                </div>

                <div className="space-y-4">
                  {categories.map((category) => {
                    const catPerms = SYSTEM_PERMISSIONS.filter((p) => p.category === category);
                    const allCatSelected = catPerms.every((p) => selectedPermissions.includes(p.code));

                    return (
                      <div
                        key={category}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider">
                            {category === 'Catalog' && <Boxes className="w-3.5 h-3.5" />}
                            {category === 'Orders' && <ShoppingBag className="w-3.5 h-3.5" />}
                            {category === 'Customers' && <Users className="w-3.5 h-3.5" />}
                            {category === 'System' && <Sliders className="w-3.5 h-3.5" />}
                            {category === 'Analytics' && <BarChart3 className="w-3.5 h-3.5" />}
                            {category} Modules
                          </span>

                          <button
                            type="button"
                            onClick={() => selectCategoryAll(category)}
                            className="text-2xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            {allCatSelected ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {catPerms.map((perm) => {
                            const isChecked = selectedPermissions.includes(perm.code);
                            return (
                              <label
                                key={perm.code}
                                className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                                  isChecked
                                    ? 'bg-white dark:bg-zinc-800 border-indigo-300 dark:border-indigo-800 shadow-2xs'
                                    : 'border-transparent hover:bg-slate-100 dark:hover:bg-zinc-800/60'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => togglePermission(perm.code)}
                                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                <div>
                                  <p className="font-semibold text-slate-900 dark:text-white leading-tight">
                                    {perm.label}
                                  </p>
                                  <p className="text-2xs text-slate-400 dark:text-zinc-500 mt-0.5">
                                    {perm.description}
                                  </p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-5 py-2 text-xs font-semibold rounded-lg shadow-sm"
                >
                  {editingRole ? 'Save Changes' : 'Create Permission Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
