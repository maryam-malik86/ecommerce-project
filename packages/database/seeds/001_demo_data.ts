import type { Knex } from 'knex';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

// ── Helper ──────────────────────────────────────────────────────────────────
const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ─────────────────────────────────────────────────────────────────────────────
// SEED: 001_full_demo_data
//
// Seeds the entire database with realistic demo data so the admin panel
// looks populated right after migrations.
//
// Tables seeded (in dependency order):
//   api_clients → users → categories → products → product_variants →
//   suppliers → stock_movements → orders → order_items → newsletter_subscribers
//
// Run: pnpm --filter @ecommerce/database seed:run
// ─────────────────────────────────────────────────────────────────────────────
export async function seed(knex: Knex): Promise<void> {
  // ── Truncate in reverse-FK order ─────────────────────────────────────────
  await knex.raw('SET FOREIGN_KEY_CHECKS = 0');
  await knex.raw('ALTER TABLE products MODIFY category_id INT UNSIGNED NULL');
  for (const t of [
    'user_permissions','permissions','email_campaigns','discounts',
    'product_images','variant_option_values','product_option_values','product_options',
    'fulfillment_items','fulfillments','webhook_events','payments',
    'cart_items','carts','refresh_tokens','newsletter_subscribers',
    'stock_reservations','stock_movements','order_items','orders',
    'product_variants','products','suppliers','categories','users','api_clients',
  ]) {
    await knex(t).truncate();
  }
  await knex.raw('SET FOREIGN_KEY_CHECKS = 1');

  // ── 1. API Clients ────────────────────────────────────────────────────────
  const API_KEY_ADMIN = 'admin-api-key-dev-1234567890abcdef';
  const API_KEY_STORE = 'storefront-api-key-dev-1234567890abcdef';

  await knex('api_clients').insert([
    {
      name: 'Admin Panel',
      api_key: API_KEY_ADMIN,
      allowed_origins: JSON.stringify(['http://localhost:5173','http://localhost:3000']),
      is_active: true,
    },
    {
      name: 'Storefront',
      api_key: API_KEY_STORE,
      allowed_origins: JSON.stringify(['http://localhost:3001']),
      is_active: true,
    },
  ]);

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║            DEMO API KEYS (save these!)              ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  Admin:     ${API_KEY_ADMIN}  ║`);
  console.log(`║  Storefront:${API_KEY_STORE}  ║`);
  console.log('╚══════════════════════════════════════════════════════╝\n');

  // ── 2. Users ──────────────────────────────────────────────────────────────
  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  const [adminId] = await knex('users').insert({
    name: 'Admin User', email: 'admin@store.com',
    password_hash: hash('Admin1234!'), role: 'admin', is_active: true,
  });

  const customerIds: number[] = [];
  const customers = [
    { name: 'Alice Johnson', email: 'alice@example.com' },
    { name: 'Bob Smith',     email: 'bob@example.com' },
    { name: 'Carol Davis',   email: 'carol@example.com' },
    { name: 'David Lee',     email: 'david@example.com' },
    { name: 'Emma Wilson',   email: 'emma@example.com' },
    { name: 'Frank Miller',  email: 'frank@example.com' },
    { name: 'Grace Turner',  email: 'grace@example.com' },
    { name: 'Henry Brown',   email: 'henry@example.com' },
  ];
  for (const c of customers) {
    const [id] = await knex('users').insert({
      ...c, password_hash: hash('Customer123!'), role: 'customer', is_active: true,
    });
    customerIds.push(id!);
  }

  const [supplierId1] = await knex('users').insert({
    name: 'TechSupply Co', email: 'supplier@techsupply.com',
    password_hash: hash('Supplier123!'), role: 'supplier', is_active: true,
  });

  // ── 3. Categories ─────────────────────────────────────────────────────────
  const [catElecRaw] = await knex('categories').insert({ name: 'Electronics',   slug: 'electronics',    description: 'Gadgets and devices', parent_id: null });
  const [catFashRaw] = await knex('categories').insert({ name: 'Fashion',        slug: 'fashion',        description: 'Clothing and accessories', parent_id: null });
  const [catHomeRaw] = await knex('categories').insert({ name: 'Home & Garden',  slug: 'home-garden',    description: 'Furniture and décor', parent_id: null });
  const [catBookRaw] = await knex('categories').insert({ name: 'Books',          slug: 'books',          description: 'Physical and digital books', parent_id: null });
  const [catSportRaw]= await knex('categories').insert({ name: 'Sports & Outdoors', slug: 'sports-outdoors', description: 'Equipment and apparel', parent_id: null });

  const catElec = catElecRaw!;
  const catFash = catFashRaw!;
  const catHome = catHomeRaw!;
  const catBook = catBookRaw!;
  const catSport = catSportRaw!;

  // ── 4. Products ───────────────────────────────────────────────────────────
  interface ProductDef {
    name: string; category_id: number; description: string; status: string;
    variants: Array<{ sku: string; label: string; cost: number; price: number; stock: number; }>;
  }

  const productDefs: ProductDef[] = [
    {
      name: 'Wireless Noise-Cancelling Headphones', category_id: catElec, status: 'active',
      description: 'Premium over-ear headphones with ANC and 30-hour battery.',
      variants: [
        { sku: 'WH-BLK-001', label: 'Midnight Black', cost: 45, price: 149, stock: 42 },
        { sku: 'WH-WHT-001', label: 'Pearl White',    cost: 45, price: 149, stock: 18 },
      ],
    },
    {
      name: 'Mechanical Gaming Keyboard', category_id: catElec, status: 'active',
      description: 'TKL layout, RGB backlighting, Cherry MX Red switches.',
      variants: [
        { sku: 'KB-RGB-TKL', label: 'RGB / US Layout', cost: 32, price: 99, stock: 55 },
      ],
    },
    {
      name: '4K Ultra-Wide Monitor', category_id: catElec, status: 'active',
      description: '34-inch curved VA panel, 144Hz, HDR400.',
      variants: [
        { sku: 'MON-34UW-BLK', label: '34″ Black', cost: 210, price: 549, stock: 12 },
      ],
    },
    {
      name: 'Portable SSD 1TB', category_id: catElec, status: 'active',
      description: 'USB-C / USB-A, read 1050 MB/s, rugged aluminium body.',
      variants: [
        { sku: 'SSD-1TB-SLV', label: '1TB Silver', cost: 38, price: 89, stock: 73 },
        { sku: 'SSD-2TB-SLV', label: '2TB Silver', cost: 70, price: 159, stock: 29 },
      ],
    },
    {
      name: 'Smart Watch Series X', category_id: catElec, status: 'active',
      description: 'GPS, heart rate, SpO2, IP68, 7-day battery.',
      variants: [
        { sku: 'SW-41-BLK', label: '41mm Black', cost: 55, price: 199, stock: 34 },
        { sku: 'SW-45-SLV', label: '45mm Silver', cost: 62, price: 229, stock: 21 },
      ],
    },
    {
      name: 'Premium Cotton T-Shirt', category_id: catFash, status: 'active',
      description: '100% organic cotton, pre-shrunk, unisex fit.',
      variants: [
        { sku: 'TS-WHT-S',  label: 'White / S',  cost: 4,  price: 29, stock: 85 },
        { sku: 'TS-WHT-M',  label: 'White / M',  cost: 4,  price: 29, stock: 120 },
        { sku: 'TS-WHT-L',  label: 'White / L',  cost: 4,  price: 29, stock: 95 },
        { sku: 'TS-BLK-M',  label: 'Black / M',  cost: 4,  price: 29, stock: 3 },
      ],
    },
    {
      name: 'Running Shoes Pro', category_id: catSport, status: 'active',
      description: 'Lightweight foam midsole, breathable mesh upper.',
      variants: [
        { sku: 'RS-BLU-40', label: 'Blue / EU40', cost: 28, price: 89, stock: 14 },
        { sku: 'RS-BLU-42', label: 'Blue / EU42', cost: 28, price: 89, stock: 22 },
        { sku: 'RS-BLU-44', label: 'Blue / EU44', cost: 28, price: 89, stock: 0 },
      ],
    },
    {
      name: 'Minimalist Desk Lamp', category_id: catHome, status: 'active',
      description: 'USB-C powered, adjustable colour temperature, 3 brightness levels.',
      variants: [
        { sku: 'LAMP-WHT', label: 'White', cost: 9, price: 39, stock: 60 },
        { sku: 'LAMP-BLK', label: 'Black', cost: 9, price: 39, stock: 48 },
      ],
    },
    {
      name: 'The Pragmatic Programmer', category_id: catBook, status: 'active',
      description: '20th Anniversary Edition. By David Thomas & Andrew Hunt.',
      variants: [
        { sku: 'BOOK-PPR-PB', label: 'Paperback', cost: 15, price: 44, stock: 30 },
        { sku: 'BOOK-PPR-HB', label: 'Hardback',  cost: 22, price: 59, stock: 10 },
      ],
    },
    {
      name: 'Ergonomic Office Chair', category_id: catHome, status: 'active',
      description: 'Lumbar support, mesh back, adjustable armrests.',
      variants: [
        { sku: 'CHAIR-BLK', label: 'Black', cost: 95, price: 349, stock: 8 },
        { sku: 'CHAIR-GRY', label: 'Grey',  cost: 95, price: 349, stock: 5 },
      ],
    },
    {
      name: 'Yoga Mat Pro', category_id: catSport, status: 'active',
      description: '6mm non-slip TPE mat with alignment lines.',
      variants: [
        { sku: 'YOGA-PRP', label: 'Purple', cost: 12, price: 49, stock: 40 },
        { sku: 'YOGA-GRN', label: 'Green',  cost: 12, price: 49, stock: 2 },
      ],
    },
    {
      name: 'Vintage Denim Jacket', category_id: catFash, status: 'inactive',
      description: 'Washed indigo, relaxed fit, two chest pockets.',
      variants: [
        { sku: 'DJ-IND-S', label: 'Indigo / S', cost: 22, price: 89, stock: 6 },
        { sku: 'DJ-IND-L', label: 'Indigo / L', cost: 22, price: 89, stock: 4 },
      ],
    },
  ];

  const variantRows: Array<{
    product_id: number; sku: string; option_label: string;
    cost_price: number; selling_price: number; stock_quantity: number;
    low_stock_threshold: number; image_url: null;
  }> = [];

  for (const pd of productDefs) {
    const [productIdRaw] = await knex('products').insert({
      category_id: pd.category_id,
      name: pd.name,
      slug: slug(pd.name),
      description: pd.description,
      status: pd.status,
    });
    const productId = productIdRaw!;
    for (const v of pd.variants) {
      const [vidRaw] = await knex('product_variants').insert({
        product_id: productId,
        sku: v.sku,
        option_label: v.label,
        cost_price: v.cost,
        selling_price: v.price,
        stock_quantity: v.stock,
        low_stock_threshold: 5,
        image_url: null,
      });
      const vid = vidRaw!;
      variantRows.push({
        product_id: productId, sku: v.sku, option_label: v.label,
        cost_price: v.cost, selling_price: v.price,
        stock_quantity: v.stock, low_stock_threshold: 5, image_url: null,
      });
      // Record initial stock-in movement
      await knex('stock_movements').insert({
        variant_id: vid, supplier_id: null, order_id: null,
        type: 'in', quantity: v.stock, note: 'Initial stock from seed',
      });
    }
  }

  // ── 5. Supplier record ────────────────────────────────────────────────────
  await knex('suppliers').insert([
    { name: 'TechSupply Co', contact_email: 'orders@techsupply.com', contact_phone: '+1-555-010-0200', address: '123 Silicon Ave, San Jose CA 95110' },
    { name: 'Fashion Forward Ltd', contact_email: 'b2b@fashfwd.com', contact_phone: '+44-20-7946-0958', address: '45 Carnaby St, London W1F 9PT' },
    { name: 'HomeGoods Direct', contact_email: 'wholesale@homegoodsdirect.com', contact_phone: '+1-555-033-9900', address: '800 Commerce Blvd, Atlanta GA 30301' },
  ]);

  // ── 6. Orders (30 spread over last 60 days) ───────────────────────────────
  const STATUSES = ['delivered','delivered','delivered','shipped','processing','confirmed','pending','cancelled','refunded'];
  const PAYMENT  = ['paid','paid','paid','paid','unpaid','paid','unpaid','unpaid','refunded'];

  // All variants: fetch them so we have IDs + prices
  const allVariants = await knex('product_variants').select('id','cost_price','selling_price','product_id');

  const now = new Date();
  for (let i = 0; i < 30; i++) {
    const daysAgo = Math.floor(Math.random() * 60);
    const orderDate = new Date(now.getTime() - daysAgo * 86_400_000);
    const statusIdx = Math.floor(Math.random() * STATUSES.length);
    const userId = customerIds[i % customerIds.length];

    // Pick 1–3 random variants for the order
    const picked: typeof allVariants = [];
    const copy = [...allVariants];
    const itemCount = Math.floor(Math.random() * 3) + 1;
    for (let k = 0; k < itemCount && copy.length; k++) {
      const idx = Math.floor(Math.random() * copy.length);
      picked.push(copy.splice(idx, 1)[0]);
    }

    let total = 0;
    const items = picked.map((v) => {
      const qty = Math.floor(Math.random() * 3) + 1;
      const lineTotal = Number(v.selling_price) * qty;
      total += lineTotal;
      return {
        variant_id:         v.id,
        quantity:           qty,
        unit_cost_price:    Number(v.cost_price),
        unit_selling_price: Number(v.selling_price),
        line_total:         lineTotal,
      };
    });

    const [orderId] = await knex('orders').insert({
      user_id: userId,
      status: STATUSES[statusIdx],
      payment_status: PAYMENT[statusIdx],
      shipping_address: JSON.stringify({
        street: `${100 + i} Main Street`,
        city: ['New York','Los Angeles','Chicago','Houston','Phoenix'][i % 5],
        state: ['NY','CA','IL','TX','AZ'][i % 5],
        zip: `${10000 + i * 3}`,
        country: 'US',
      }),
      total_amount: total.toFixed(2),
      notes: null,
      created_at: orderDate,
      updated_at: orderDate,
    });

    for (const item of items) {
      await knex('order_items').insert({ order_id: orderId, ...item });
    }
  }

  // ── 7. Newsletter subscribers ─────────────────────────────────────────────
  const newsletterEmails = [
    { email: 'alice@example.com',   name: 'Alice Johnson',   is_active: true },
    { email: 'bob@example.com',     name: 'Bob Smith',       is_active: true },
    { email: 'carol@example.com',   name: 'Carol Davis',     is_active: true },
    { email: 'david@example.com',   name: 'David Lee',       is_active: false },
    { email: 'emma@example.com',    name: 'Emma Wilson',     is_active: true },
    { email: 'frank@example.com',   name: 'Frank Miller',    is_active: true },
    { email: 'grace@example.com',   name: 'Grace Turner',    is_active: true },
    { email: 'henry@example.com',   name: 'Henry Brown',     is_active: false },
    { email: 'iris@example.com',    name: 'Iris Chen',       is_active: true },
    { email: 'jack@example.com',    name: 'Jack White',      is_active: true },
    { email: 'kate@example.com',    name: 'Kate Stone',      is_active: true },
    { email: 'liam@example.com',    name: 'Liam Fox',        is_active: true },
    { email: 'mia@example.com',     name: 'Mia Rodriguez',   is_active: false },
    { email: 'noah@example.com',    name: 'Noah Taylor',     is_active: true },
    { email: 'olivia@example.com',  name: 'Olivia Park',     is_active: true },
  ];
  await knex('newsletter_subscribers').insert(newsletterEmails);

  // ── 8. Discounts ─────────────────────────────────────────────────────────────
  await knex('discounts').insert([
    { code: 'SUMMER20', type: 'percentage', value: 20.00, min_order_amount: 50.00, is_active: true },
    { code: 'WELCOME10', type: 'fixed', value: 10.00, min_order_amount: 30.00, is_active: true },
    { code: 'VIP50', type: 'percentage', value: 50.00, min_order_amount: 150.00, is_active: true },
  ]);

  // ── 9. Permissions ───────────────────────────────────────────────────────────
  await knex('permissions').insert([
    { code: 'orders.manage' },
    { code: 'products.manage' },
    { code: 'inventory.manage' },
    { code: 'discounts.manage' },
    { code: 'users.manage' },
  ]);

  // ── Done ─────────────────────────────────────────────────────────────────
  console.log('✅  Demo data seeded successfully!');
  console.log('    Admin login: admin@store.com / Admin1234!');
  console.log(`    Admin API key: ${API_KEY_ADMIN}`);
  console.log(`    Storefront API key: ${API_KEY_STORE}`);
  console.log('\n    Copy the admin API key into apps/admin/.env:');
  console.log(`    VITE_API_KEY=${API_KEY_ADMIN}\n`);
}
