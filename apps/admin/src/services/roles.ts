export interface PermissionItem {
  code: string;
  label: string;
  description: string;
  category: 'Catalog' | 'Orders' | 'Customers' | 'System' | 'Analytics';
}

export const SYSTEM_PERMISSIONS: PermissionItem[] = [
  // Catalog & Inventory
  { code: 'products.view', label: 'View Products', description: 'Browse and search product catalog', category: 'Catalog' },
  { code: 'products.manage', label: 'Manage Products', description: 'Create, update, and delete products & variants', category: 'Catalog' },
  { code: 'categories.manage', label: 'Manage Categories', description: 'Create and organize product categories', category: 'Catalog' },
  { code: 'inventory.manage', label: 'Manage Inventory', description: 'Adjust stock levels and supplier links', category: 'Catalog' },

  // Orders
  { code: 'orders.view', label: 'View Orders', description: 'View customer orders and invoice details', category: 'Orders' },
  { code: 'orders.manage', label: 'Manage Orders', description: 'Process order status, fulfillments, and shipping', category: 'Orders' },
  { code: 'orders.refund', label: 'Issue Refunds', description: 'Process full and partial order refunds', category: 'Orders' },

  // Customers
  { code: 'customers.view', label: 'View Customers', description: 'Access customer directory and order history', category: 'Customers' },
  { code: 'customers.manage', label: 'Manage Customers', description: 'Edit customer profiles and account status', category: 'Customers' },

  // System & Security
  { code: 'system.settings', label: 'Manage Settings', description: 'Configure store general settings & currency', category: 'System' },
  { code: 'system.staff', label: 'Manage Staff', description: 'Create and edit system staff accounts', category: 'System' },
  { code: 'system.roles', label: 'Manage Roles', description: 'Create and modify permission groups', category: 'System' },

  // Analytics & Marketing
  { code: 'analytics.view', label: 'View Analytics', description: 'Access revenue reports and sales stats', category: 'Analytics' },
  { code: 'newsletter.manage', label: 'Manage Newsletter', description: 'Send broadcasts and export subscribers', category: 'Analytics' },
];

export interface RoleGroup {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  memberCount: number;
  badgeColor: string;
  permissions: string[];
}

export const INITIAL_ROLES: RoleGroup[] = [
  {
    id: 'admin',
    name: 'Super Administrator',
    description: 'Full unmitigated root access to all store modules, financial data, staff, and system configurations',
    isSystem: true,
    memberCount: 1,
    badgeColor: 'purple',
    permissions: SYSTEM_PERMISSIONS.map((p) => p.code),
  },
  {
    id: 'supplier',
    name: 'Store Manager',
    description: 'Operational control over catalog, inventory, order processing, and customer relationship management',
    isSystem: true,
    memberCount: 1,
    badgeColor: 'emerald',
    permissions: [
      'products.view',
      'products.manage',
      'categories.manage',
      'inventory.manage',
      'orders.view',
      'orders.manage',
      'customers.view',
      'customers.manage',
      'analytics.view',
    ],
  },
  {
    id: 'catalog_specialist',
    name: 'Catalog & Stock Specialist',
    description: 'Dedicated access to products, categories, media assets, and supplier inventory management',
    isSystem: false,
    memberCount: 0,
    badgeColor: 'blue',
    permissions: ['products.view', 'products.manage', 'categories.manage', 'inventory.manage'],
  },
  {
    id: 'support_agent',
    name: 'Order Support Agent',
    description: 'Frontline support team access to search orders, inspect customer history, and issue basic updates',
    isSystem: false,
    memberCount: 0,
    badgeColor: 'amber',
    permissions: ['orders.view', 'orders.manage', 'customers.view'],
  },
];

const STORAGE_KEY = 'ecommerce_system_roles_v1';

export function getRoles(): RoleGroup[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ROLES));
      return INITIAL_ROLES;
    }
    const parsed: RoleGroup[] = JSON.parse(data);
    // Ensure default system roles are always present
    const existingIds = new Set(parsed.map((r) => r.id));
    let updated = [...parsed];
    for (const initRole of INITIAL_ROLES) {
      if (!existingIds.has(initRole.id)) {
        updated.unshift(initRole);
      }
    }
    return updated;
  } catch (err) {
    console.error('Failed to load roles from storage:', err);
    return INITIAL_ROLES;
  }
}

export function saveRoles(roles: RoleGroup[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
    // Dispatch a custom window event so other components react to role updates immediately
    window.dispatchEvent(new CustomEvent('roles-updated'));
  } catch (err) {
    console.error('Failed to save roles to storage:', err);
  }
}

export function getRoleById(roleId: string): RoleGroup | undefined {
  const roles = getRoles();
  return roles.find((r) => r.id === roleId || r.id === roleId.toLowerCase());
}

export function getRolePermissionsList(roleId: string): PermissionItem[] {
  const role = getRoleById(roleId);
  if (!role) {
    return SYSTEM_PERMISSIONS;
  }
  return role.permissions
    .map((code) => SYSTEM_PERMISSIONS.find((p) => p.code === code))
    .filter((p): p is PermissionItem => p !== undefined);
}

export function getRolePermissionsFormatted(roleId: string): Array<{ label: string; scope: string }> {
  const perms = getRolePermissionsList(roleId);
  return perms.map((p) => ({
    label: `${p.category} Modules`,
    scope: p.label,
  }));
}


import { useState, useEffect } from 'react';

export function useDynamicRoles(): RoleGroup[] {
  const [roles, setRoles] = useState<RoleGroup[]>(() => getRoles());

  useEffect(() => {
    const handleUpdate = () => setRoles(getRoles());
    window.addEventListener('roles-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('roles-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return roles;
}

