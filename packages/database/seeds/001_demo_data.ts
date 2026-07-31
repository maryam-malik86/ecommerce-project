import type { Knex } from 'knex';

const SYSTEM_PERMISSIONS = [
  { code: 'dashboard.view', label: 'View Dashboard Analytics', category: 'General', description: 'Access standard reporting and high-level KPIs' },
  { code: 'products.view', label: 'View Catalog Items', category: 'Catalog', description: 'Browse and search product listings' },
  { code: 'products.manage', label: 'Manage Catalog Items', category: 'Catalog', description: 'Create, update, and archive products and variants' },
  { code: 'categories.manage', label: 'Manage Categories', category: 'Catalog', description: 'Modify taxonomy and category hierarchies' },
  { code: 'orders.view', label: 'View Orders', category: 'Orders', description: 'Search and inspect customer purchase orders' },
  { code: 'orders.manage', label: 'Manage Orders', category: 'Orders', description: 'Update status, process cancellations, and issue refunds' },
  { code: 'customers.view', label: 'View Customer Profiles', category: 'Customers', description: 'Access customer directory and LTV metrics' },
  { code: 'customers.manage', label: 'Manage Customers', category: 'Customers', description: 'Edit profiles, soft-archive accounts, and manage notes/tags' },
  { code: 'inventory.manage', label: 'Manage Stock & Warehousing', category: 'Inventory', description: 'Perform stock adjustments and view movements' },
  { code: 'staff.manage', label: 'Manage Administrative Staff', category: 'System', description: 'Provision staff accounts and assign security roles' },
  { code: 'roles.manage', label: 'Manage Roles & Security Permissions', category: 'System', description: 'Create custom roles and configure access control lists' },
];

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function seed(knex: Knex): Promise<void> {
  // Truncate tables cleanly
  const tables = [
    'customer_notes', 'customer_tags', 'tags', 'audit_logs',
    'newsletter_subscribers', 'stock_reservations', 'stock_movements',
    'order_items', 'orders', 'product_variants', 'products', 'categories',
    'suppliers', 'role_permissions', 'permissions', 'users', 'roles'
  ];

  await knex.raw('SET FOREIGN_KEY_CHECKS = 0');
  for (const table of tables) {
    if (await knex.schema.hasTable(table)) {
      await knex(table).truncate();
    }
  }
  await knex.raw('SET FOREIGN_KEY_CHECKS = 1');

  // ── 1. Roles & Permissions ────────────────────────────────────────────────
  const hasLabel = await knex.schema.hasColumn('permissions', 'label');
  const hasDesc = await knex.schema.hasColumn('permissions', 'description');
  const hasCategory = await knex.schema.hasColumn('permissions', 'category');
  const hasCreatedAt = await knex.schema.hasColumn('permissions', 'created_at');
  const hasUpdatedAt = await knex.schema.hasColumn('permissions', 'updated_at');

  if (!hasLabel || !hasDesc || !hasCategory || !hasCreatedAt || !hasUpdatedAt) {
    await knex.schema.alterTable('permissions', (table) => {
      if (!hasLabel) table.string('label', 150).notNullable().defaultTo('');
      if (!hasDesc) table.text('description').nullable();
      if (!hasCategory) table.string('category', 50).notNullable().defaultTo('General');
      if (!hasCreatedAt) table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      if (!hasUpdatedAt) table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    });
  }

  const permIdMap: Record<string, number> = {};
  for (const perm of SYSTEM_PERMISSIONS) {
    const existing = await knex('permissions').where({ code: perm.code }).first();
    if (existing) {
      await knex('permissions').where({ id: existing.id }).update(perm);
      permIdMap[perm.code] = existing.id;
    } else {
      const [id] = await knex('permissions').insert(perm);
      permIdMap[perm.code] = id!;
    }
  }

  const [superAdminRoleId] = await knex('roles').insert({
    name: 'Super Administrator',
    slug: 'super_admin',
    description: 'Full unmitigated root access to all store modules, financial data, staff, and system configurations',
    is_system: true,
    badge_color: 'purple',
  });

  const [storeManagerRoleId] = await knex('roles').insert({
    name: 'Store Manager',
    slug: 'store_manager',
    description: 'Operational control over catalog, inventory, order processing, and customer relationship management',
    is_system: true,
    badge_color: 'emerald',
  });

  const rolePermsInsert: Array<{ role_id: number; permission_id: number }> = [];
  for (const permId of Object.values(permIdMap)) {
    rolePermsInsert.push({ role_id: superAdminRoleId!, permission_id: permId });
  }
  for (const [code, permId] of Object.entries(permIdMap)) {
    if (!code.startsWith('staff.') && !code.startsWith('roles.')) {
      rolePermsInsert.push({ role_id: storeManagerRoleId!, permission_id: permId });
    }
  }
  await knex('role_permissions').insert(rolePermsInsert);

  // ── 2. Users (Admins & Customers) ──────────────────────────────────────────
  const bcryptHash = '$2a$12$e/a62YdC.kRj5xJbB6tL4u0wGZzW1.A5eD0.B.C.D.E.F.G.H'; // "admin123"

  const [adminId] = await knex('users').insert({
    name: 'Maryam Malik (Admin)',
    email: 'admin@demo.com',
    password_hash: bcryptHash,
    role: 'admin',
    role_id: superAdminRoleId,
    is_active: true,
  });

  const customers = [
    { name: 'Alice Johnson', email: 'alice@example.com' },
    { name: 'Bob Smith', email: 'bob@example.com' },
    { name: 'Charlie Brown', email: 'charlie@example.com' },
    { name: 'Diana Prince', email: 'diana@example.com' },
    { name: 'Emma Wilson', email: 'emma@example.com' },
  ];

  const customerIds: number[] = [];
  for (const c of customers) {
    const [cid] = await knex('users').insert({
      name: c.name,
      email: c.email,
      password_hash: bcryptHash,
      role: 'customer',
      role_id: null,
      is_active: true,
    });
    customerIds.push(cid!);
  }

  // ── 3. Suppliers (with country flags) ──────────────────────────────────────
  const [supp1] = await knex('suppliers').insert({
    name: 'Rt', country_code: 'FR', country_flag: '🇫🇷',
    contact_email: 'rt@suppliers.fr', contact_phone: '+33-1-40-50-60', address: 'Paris, France'
  });
  const [supp2] = await knex('suppliers').insert({
    name: 'liia', country_code: 'IT', country_flag: '🇮🇹',
    contact_email: 'liia@suppliers.it', contact_phone: '+39-06-698', address: 'Milan, Italy'
  });
  const [supp3] = await knex('suppliers').insert({
    name: 'Test me', country_code: 'US', country_flag: '🇺🇸',
    contact_email: 'testme@suppliers.com', contact_phone: '+1-555-0192', address: 'New York, USA'
  });
  const [supp4] = await knex('suppliers').insert({
    name: 'Used', country_code: 'US', country_flag: '🇺🇸',
    contact_email: 'used@suppliers.com', contact_phone: '+1-555-0144', address: 'Chicago, USA'
  });
  const [supp5] = await knex('suppliers').insert({
    name: 'new supplier', country_code: 'AU', country_flag: '🇦🇺',
    contact_email: 'new@suppliers.com.au', contact_phone: '+61-2-9000-0000', address: 'Sydney, Australia'
  });
  const [supp6] = await knex('suppliers').insert({
    name: 'Offline supplier', country_code: 'US', country_flag: '🇺🇸',
    contact_email: 'offline@suppliers.com', contact_phone: '+1-555-9988', address: 'Los Angeles, USA'
  });

  // ── 4. Categories ──────────────────────────────────────────────────────────
  const categoriesData = [
    { name: 'Travel & Luggage', slug: 'travel-luggage', description: 'Suitcases, carry-ons, and travel accessories' },
    { name: 'Apparel & Outerwear', slug: 'apparel-outerwear', description: 'Jackets, coats, and activewear' },
    { name: 'Electronics & Gear', slug: 'electronics-gear', description: 'Tech gadgets, chargers, and audio' },
    { name: 'Home & Kitchen', slug: 'home-kitchen', description: 'Modern home goods and cookware' },
  ];

  const catIds: number[] = [];
  for (const cat of categoriesData) {
    const [id] = await knex('categories').insert(cat);
    catIds.push(id!);
  }

  // ── 5. Enterprise Catalog Products (Matching Reference Screenshots) ──────
  const demoProducts = [
    {
      name: 'Azyyau Premium Spinner Suitcase',
      catIdx: 0, supplier_id: supp1, supplier_ref: 'AZY-990', our_ref: 'OUR-AZY-01', ba_ref: 'BA-9901',
      brand: 'GLIMS Enterprise', season: 'Summer 2026 Collection', department: 'Travel & Luggage',
      proposed_retail: 250.00, proposed_qty: 45,
      colors: JSON.stringify([{ name: 'Navy Blue', hex: '#1e3a8a' }, { name: 'Cyan', hex: '#06b6d4' }]),
      materials: JSON.stringify(['Polycarbonate', 'Aluminum Frame', 'TSA Lock']),
      image_url: 'https://images.unsplash.com/photo-1565026057447-b88e3f29042b?w=600&auto=format&fit=crop&q=80',
      photos: JSON.stringify([
        'https://images.unsplash.com/photo-1565026057447-b88e3f29042b?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1581553680321-4fffae59febd?w=600&auto=format&fit=crop&q=80'
      ]),
      skus: ['AZY-990-NAVY', 'AZY-990-CYAN'], options: ['Navy Blue / Carry-on', 'Cyan / Check-in'], price: 250.00, cost: 120.00, stock: 45
    },
    {
      name: 'Binhi Waterproof Travel Duffel',
      catIdx: 0, supplier_id: supp2, supplier_ref: 'BIN-202', our_ref: 'OUR-BIN-02', ba_ref: 'BA-2022',
      brand: 'Horizon Travel', season: 'Eco Travel Collection (SEA010)', department: 'Travel & Luggage',
      proposed_retail: 0.00, proposed_qty: 0,
      colors: JSON.stringify([{ name: 'Black', hex: '#000000' }, { name: 'Tan', hex: '#d97706' }]),
      materials: JSON.stringify(['Polycarbonate', 'Canvas Fabric']),
      image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
      photos: JSON.stringify(['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80']),
      skus: ['BIN-202-BLK'], options: ['Black Standard'], price: 0.00, cost: 40.00, stock: 15
    },
    {
      name: 'Ahhahaha Modular Hardshell Carry-On',
      catIdx: 0, supplier_id: supp3, supplier_ref: 'AHH-100', our_ref: 'OUR-AHH-03', ba_ref: 'BA-1003',
      brand: 'ExploreHub', season: 'Eco Travel Collection (SEA010)', department: 'Travel & Luggage',
      proposed_retail: 100.00, proposed_qty: 30,
      colors: JSON.stringify([{ name: 'Teal', hex: '#0d9488' }, { name: 'Blue', hex: '#2563eb' }, { name: 'Dark Navy', hex: '#1e1b4b' }]),
      materials: JSON.stringify(['Polycarbonate']),
      image_url: 'https://images.unsplash.com/photo-1581553680321-4fffae59febd?w=600&auto=format&fit=crop&q=80',
      photos: JSON.stringify(['https://images.unsplash.com/photo-1581553680321-4fffae59febd?w=600&auto=format&fit=crop&q=80']),
      skus: ['AHH-100-TEAL', 'AHH-100-BLUE'], options: ['Teal Hardshell', 'Blue Hardshell'], price: 100.00, cost: 45.00, stock: 30
    },
    {
      name: 'Haha Expandable Rolling Suitcase',
      catIdx: 0, supplier_id: supp4, supplier_ref: 'HAH-200', our_ref: 'OUR-HAH-04', ba_ref: 'BA-2004',
      brand: 'ExploreHub', season: 'Autumn Voyage 2026', department: 'Travel & Luggage',
      proposed_retail: 200.00, proposed_qty: 50,
      colors: JSON.stringify([{ name: 'Blue', hex: '#2563eb' }, { name: 'Orange', hex: '#ea580c' }, { name: 'Tan', hex: '#d97706' }, { name: 'Coral', hex: '#f43f5e' }]),
      materials: JSON.stringify(['Polyester Fabric', 'Rubber Wheels']),
      image_url: 'https://images.unsplash.com/photo-1565026057447-b88e3f29042b?w=600&auto=format&fit=crop&q=80',
      photos: JSON.stringify(['https://images.unsplash.com/photo-1565026057447-b88e3f29042b?w=600&auto=format&fit=crop&q=80']),
      skus: ['HAH-200-MULTI'], options: ['Multi-Color Spinner'], price: 200.00, cost: 90.00, stock: 50
    },
    {
      name: 'eeeee Lightweight Canvas Travel Tote',
      catIdx: 0, supplier_id: supp2, supplier_ref: 'EEE-000', our_ref: 'OUR-EEE-05', ba_ref: 'BA-0005',
      brand: 'Horizon Travel', season: 'Summer 2026 Collection', department: 'Travel & Luggage',
      proposed_retail: 0.00, proposed_qty: 0,
      colors: JSON.stringify([{ name: 'Olive', hex: '#65a30d' }, { name: 'Cyan', hex: '#06b6d4' }, { name: 'Blue', hex: '#2563eb' }, { name: 'Crimson', hex: '#dc2626' }]),
      materials: JSON.stringify(['Canvas Fabric', 'Polycarbonate +1']),
      image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
      photos: JSON.stringify(['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80']),
      skus: ['EEE-000-OLIVE'], options: ['Olive Canvas'], price: 0.00, cost: 12.00, stock: 20
    },
    {
      name: 'Tyyy Mesh Fabric Backpack',
      catIdx: 0, supplier_id: supp5, supplier_ref: 'TYY-090', our_ref: 'OUR-TYY-06', ba_ref: 'BA-0090',
      brand: 'ExploreHub', season: 'Eco Travel Collection (SEA010)', department: 'Travel & Luggage',
      proposed_retail: 90.00, proposed_qty: 12,
      colors: JSON.stringify([{ name: 'Navy', hex: '#1e3a8a' }, { name: 'Black', hex: '#000000' }]),
      materials: JSON.stringify(['Mesh Fabric']),
      image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
      photos: JSON.stringify(['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80']),
      skus: ['TYY-090-NVY'], options: ['Navy Mesh'], price: 90.00, cost: 35.00, stock: 12
    },
    {
      name: 'Huhhh Steel Zipper Travel Organizer',
      catIdx: 0, supplier_id: supp6, supplier_ref: 'HUH-100', our_ref: 'OUR-HUH-07', ba_ref: 'BA-0100',
      brand: 'Horizon Travel', season: 'Eco Travel Collection (SEA010)', department: 'Travel & Luggage',
      proposed_retail: 100.00, proposed_qty: 25,
      colors: JSON.stringify([{ name: 'Blue', hex: '#2563eb' }, { name: 'Teal', hex: '#0d9488' }, { name: 'Gold', hex: '#eab308' }, { name: 'Black', hex: '#000000' }]),
      materials: JSON.stringify(['Mesh Fabric', 'Steel Zipper']),
      image_url: 'https://images.unsplash.com/photo-1581553680321-4fffae59febd?w=600&auto=format&fit=crop&q=80',
      photos: JSON.stringify(['https://images.unsplash.com/photo-1581553680321-4fffae59febd?w=600&auto=format&fit=crop&q=80']),
      skus: ['HUH-100-ORG'], options: ['Standard Organizer'], price: 100.00, cost: 40.00, stock: 25
    },
  ];

  const variantIds: number[] = [];
  for (const p of demoProducts) {
    const [productId] = await knex('products').insert({
      name: p.name,
      slug: slug(p.name),
      category_id: catIds[p.catIdx],
      supplier_id: p.supplier_id,
      supplier_ref: p.supplier_ref,
      our_ref: p.our_ref,
      ba_ref: p.ba_ref,
      brand: p.brand,
      season: p.season,
      department: p.department,
      proposed_retail: p.proposed_retail,
      proposed_qty: p.proposed_qty,
      colors: p.colors,
      materials: p.materials,
      image_url: p.image_url,
      photos: p.photos,
      description: `Enterprise grade item ${p.name} built with premium components.`,
      status: 'active',
    });

    for (let i = 0; i < p.skus.length; i++) {
      const [vid] = await knex('product_variants').insert({
        product_id: productId!,
        sku: p.skus[i]!,
        option_label: p.options[i]!,
        selling_price: p.price,
        cost_price: p.cost,
        stock_quantity: p.stock,
        image_url: p.image_url,
      });
      variantIds.push(vid!);
    }
  }

  // ── 6. Stock Movements ────────────────────────────────────────────────────
  for (const vid of variantIds.slice(0, 3)) {
    await knex('stock_movements').insert({
      variant_id: vid, quantity: 50, type: 'in', supplier_id: supp1, note: 'Initial stock load',
    });
  }

  // ── 7. Orders & Order Items ───────────────────────────────────────────────
  const statuses = ['delivered', 'processing', 'confirmed', 'pending'];
  for (let i = 0; i < 5; i++) {
    const customerId = customerIds[i % customerIds.length]!;
    const status = statuses[i % statuses.length]!;
    const vid = variantIds[i % variantIds.length]!;

    const [orderId] = await knex('orders').insert({
      user_id: customerId,
      status,
      payment_status: status === 'pending' ? 'unpaid' : 'paid',
      total_amount: 99.98,
      shipping_address: JSON.stringify({ street: `${100 + i} Main St`, city: 'Springfield', state: 'IL', postal_code: '62701', country: 'US' }),
      notes: `Demo order #${i + 1}`,
    });

    await knex('order_items').insert({
      order_id: orderId!,
      variant_id: vid,
      quantity: 2,
      unit_selling_price: 49.99,
      unit_cost_price: 20.00,
      line_total: 99.98,
    });
  }

  // ── 8. Newsletter ─────────────────────────────────────────────────────────
  for (const c of customers) {
    await knex('newsletter_subscribers').insert({ email: c.email, is_active: true });
  }

  // ── 9. Tags & Customer Tags & Notes ──────────────────────────────────────
  const defaultTags = ['VIP', 'Wholesale', 'Frequent Buyer', 'New Shopper'];
  const tagIds: number[] = [];
  for (const name of defaultTags) {
    const existing = await knex('tags').where({ name }).first();
    if (existing) {
      tagIds.push(existing.id);
    } else {
      const [tid] = await knex('tags').insert({ name });
      tagIds.push(tid!);
    }
  }

  if (customerIds.length >= 2 && tagIds.length >= 2) {
    await knex('customer_tags').insert([
      { customer_id: customerIds[0]!, tag_id: tagIds[0]! },
      { customer_id: customerIds[0]!, tag_id: tagIds[2]! },
      { customer_id: customerIds[1]!, tag_id: tagIds[3]! },
    ]);

    await knex('customer_notes').insert([
      {
        customer_id: customerIds[0]!,
        author_admin_id: adminId,
        note: 'Requested priority shipping on all international orders.',
        created_at: new Date(Date.now() - 86400000 * 2),
      },
      {
        customer_id: customerIds[0]!,
        author_admin_id: adminId,
        note: 'Verified corporate discount eligibility.',
        created_at: new Date(),
      },
    ]);
  }

  console.log('✓ Database successfully seeded with enterprise catalog & demo data.');
}
