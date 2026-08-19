import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  console.log('Seeding Collections & Product Collection associations...');

  const collectionsData = [
    {
      name: 'Shop Sale',
      slug: 'shop-sale',
      description: 'Exclusive wholesale discounts on premium OR-grade surgical & dental instruments.',
    },
    {
      name: 'New In',
      slug: 'new-in',
      description: 'Newly launched medical products, titanium implant sets & precision micro-dissectors.',
    },
    {
      name: 'Moda Must Haves',
      slug: 'moda-must-haves',
      description: 'Top rated essential surgical instruments trusted by healthcare professionals worldwide.',
    },
  ];

  const collectionMap: Record<string, number> = {};

  for (const c of collectionsData) {
    const existing = await knex('collections').where({ slug: c.slug }).first();
    if (existing) {
      await knex('collections').where({ id: existing.id }).update({
        name: c.name,
        description: c.description,
        updated_at: new Date(),
      });
      collectionMap[c.slug] = existing.id;
    } else {
      const [id] = await knex('collections').insert({
        name: c.name,
        slug: c.slug,
        description: c.description,
        created_at: new Date(),
        updated_at: new Date(),
      });
      collectionMap[c.slug] = id!;
    }
  }

  // Fetch all active products
  const products = await knex('products').select('id', 'name').where({ status: 'active' });

  if (products.length === 0) {
    console.log('No products found to attach to collections. Please run 002_norasol_catalog seed first.');
    return;
  }

  // Clear existing product_collections associations for re-seeding
  await knex('product_collections').delete();

  const joinsToInsert: { product_id: number; collection_id: number }[] = [];

  products.forEach((p, idx) => {
    // Distribute products into collections
    // Shop Sale gets products at index % 2 === 0
    if (idx % 2 === 0 && collectionMap['shop-sale']) {
      joinsToInsert.push({ product_id: p.id, collection_id: collectionMap['shop-sale']! });
    }

    // New In gets products at index % 3 === 0 or % 5 === 0
    if ((idx % 3 === 0 || idx % 5 === 0) && collectionMap['new-in']) {
      joinsToInsert.push({ product_id: p.id, collection_id: collectionMap['new-in']! });
    }

    // Moda Must Haves gets products at index % 2 !== 0
    if (idx % 2 !== 0 && collectionMap['moda-must-haves']) {
      joinsToInsert.push({ product_id: p.id, collection_id: collectionMap['moda-must-haves']! });
    }
  });

  if (joinsToInsert.length > 0) {
    await knex('product_collections').insert(joinsToInsert);
  }

  console.log(`Successfully seeded ${Object.keys(collectionMap).length} collections & attached ${joinsToInsert.length} product-collection links!`);
}
