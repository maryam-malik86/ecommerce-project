import { Knex } from 'knex';

const PICS = [
  'photo-1582750433449-648ed127bb54',
  'photo-1504813184591-01572f98c85f',
  'photo-1579684453423-f84349ef60b0',
  'photo-1559757148-5c350d0d3c56',
  'photo-1576091160550-2173dba999ef',
  'photo-1585841084979-ed52a2cfed5c',
  'photo-1530026405186-ed1f139313f3',
  'photo-1551076805-e1869033e561',
] as const;

const pic = (n: number): string => PICS[n] || PICS[0];

const IMG = (id?: string, w = 700, h = 560) =>
  `https://images.unsplash.com/${id || pic(0)}?w=${w}&h=${h}&fit=crop&auto=format`;

interface SubCategorySeed {
  name: string;
  slug: string;
  tagline: string;
}

interface CategorySeed {
  name: string;
  slug: string;
  tagline: string;
  img: string;
  subcategories?: SubCategorySeed[];
}

const CATEGORIES: CategorySeed[] = [
  {
    name: 'Dental Instruments',
    slug: 'dental-instruments',
    tagline: 'Scalers, forceps, probes & explorers',
    img: PICS[0]!,
    subcategories: [
      { name: 'Extraction Forceps', slug: 'extraction-forceps', tagline: 'Anatomical forceps for atraumatic tooth removal' },
      { name: 'Scalers & Probes', slug: 'scalers-probes', tagline: 'Periodontal diagnostic & calculus removal tools' },
      { name: 'Dental Elevators', slug: 'dental-elevators', tagline: 'Luxating & root tip elevators' },
    ],
  },
  {
    name: 'Surgical Scissors',
    slug: 'surgical-scissors',
    tagline: 'Metzenbaum, Mayo, Iris & suture',
    img: PICS[2]!,
    subcategories: [
      { name: 'Dissecting Scissors', slug: 'dissecting-scissors', tagline: 'Metzenbaum & delicate tissue dissecting scissors' },
      { name: 'Operating & Mayo Scissors', slug: 'operating-mayo-scissors', tagline: 'Heavy fascia & surgical operating scissors' },
      { name: 'Micro & Iris Scissors', slug: 'micro-iris-scissors', tagline: 'Fine ophthalmic & microsurgical scissors' },
    ],
  },
  {
    name: 'Forceps & Clamps',
    slug: 'forceps-clamps',
    tagline: 'Tissue, artery & towel clamps',
    img: PICS[4]!,
    subcategories: [
      { name: 'Tissue & Dressing Forceps', slug: 'tissue-dressing-forceps', tagline: 'Adson, DeBakey & thumb tissue forceps' },
      { name: 'Hemostatic Artery Clamps', slug: 'hemostatic-artery-clamps', tagline: 'Halsted, Crile & Kocher vessel clamps' },
      { name: 'Towel Clamps & Retractors', slug: 'towel-clamps-retractors', tagline: 'Backhaus clamps & surgical retractors' },
    ],
  },
  {
    name: 'Orthopedic Sets',
    slug: 'orthopedic-sets',
    tagline: 'Elevators, curettes & osteotomes',
    img: PICS[6]!,
    subcategories: [
      { name: 'Periosteal Elevators', slug: 'periosteal-elevators', tagline: 'Freer & Cobb periosteal elevators' },
      { name: 'Bone Curettes & Chisels', slug: 'bone-curettes-chisels', tagline: 'Volkmann curettes & bone sectioning chisels' },
      { name: 'Bone Holding Forceps', slug: 'bone-holding-forceps', tagline: 'Self-retaining reduction clamps' },
    ],
  },
  {
    name: 'Implant Kits',
    slug: 'implant-kits',
    tagline: 'Full surgical implant systems',
    img: PICS[7]!,
    subcategories: [
      { name: 'Surgical Implant Placement Systems', slug: 'implant-placement-systems', tagline: 'Complete drill & placement kits' },
      { name: 'Sinus Lift & Bone Grafting', slug: 'sinus-lift-bone-grafting', tagline: 'Membrane elevation & graft condensers' },
      { name: 'Torque Wrenches & Drivers', slug: 'torque-wrenches-drivers', tagline: 'Calibrated prosthetic torque ratchets' },
    ],
  },
  {
    name: 'Liposuction Cannula',
    slug: 'liposuction-cannula',
    tagline: 'Precision harvesting & infiltration cannulas',
    img: PICS[1]!,
    subcategories: [
      { name: 'Harvesting Cannula', slug: 'harvesting-cannula', tagline: 'Multi-port fat harvesting cannulas' },
      { name: 'Tumescent Infiltration Cannula', slug: 'infiltration-cannula', tagline: 'Single & multi-luer infiltration needles' },
    ],
  },
  {
    name: 'Neurosurgery - Spinal Instruments',
    slug: 'neurosurgery-spinal-instruments',
    tagline: 'Spinal elevators & micro dissectors',
    img: PICS[3]!,
    subcategories: [
      { name: 'Spinal Dissectors & Hooks', slug: 'spinal-dissectors', tagline: 'Micro neural probes & dura elevators' },
      { name: 'Laminectomy Kerrison Rongeurs', slug: 'kerrison-rongeurs', tagline: 'Precision bone punch rongeurs' },
    ],
  },
  {
    name: 'Plastic Surgery Instruments',
    slug: 'plastic-surgery-instruments',
    tagline: 'Rhinoplasty & facelift surgical sets',
    img: PICS[5]!,
    subcategories: [
      { name: 'Rhinoplasty Rasps & Calipers', slug: 'rhinoplasty-rasps', tagline: 'Tungsten carbide bone rasps' },
      { name: 'Facelift & Skin Retractors', slug: 'facelift-retractors', tagline: 'Fiberoptic retractor systems' },
    ],
  },
  {
    name: 'Custom OEM Sets',
    slug: 'custom-oem-sets',
    tagline: 'Private-label manufacturing',
    img: PICS[6]!,
    subcategories: [
      { name: 'Private Label Kits', slug: 'private-label-kits', tagline: 'Turnkey branded surgical instrument sets' },
      { name: 'Laser Etching & Trays', slug: 'laser-etching-trays', tagline: 'Laser UDI marking & sterilization cassettes' },
    ],
  },
];

interface ProductSeed {
  sku: string;
  name: string;
  categorySlug: string;
  subcategorySlug: string;
  price: number;
  compareAt: number | null;
  description: string;
  imgId: string;
  stock: number;
}

const PRODUCTS: ProductSeed[] = [
  // Dental Instruments
  {
    sku: 'NS-D-001', name: 'Universal Periodontal Scaler Set', categorySlug: 'dental-instruments', subcategorySlug: 'scalers-probes', price: 68, compareAt: 85,
    description: 'Precision-ground periodontal scalers for effective supra- and subgingival calculus removal.',
    imgId: pic(0), stock: 46,
  },
  {
    sku: 'NS-D-002', name: 'Dental Extraction Forceps — Upper Universal', categorySlug: 'dental-instruments', subcategorySlug: 'extraction-forceps', price: 54, compareAt: null,
    description: 'Heavy-duty upper universal forceps with anatomical curved beaks for atraumatic tooth extraction.',
    imgId: pic(1), stock: 38,
  },
  {
    sku: 'NS-D-003', name: 'Dental Explorer & Probe Set (6-Piece)', categorySlug: 'dental-instruments', subcategorySlug: 'scalers-probes', price: 42.5, compareAt: null,
    description: 'Comprehensive explorer and probe set covering all diagnostic examination needs.',
    imgId: pic(0), stock: 52,
  },
  {
    sku: 'NS-D-004', name: 'Color-Coded Periodontal Probe', categorySlug: 'dental-instruments', subcategorySlug: 'scalers-probes', price: 19, compareAt: null,
    description: 'Laser-etched color-coded markings at 3–6–9–12 mm for precise, consistent pocket-depth readings.',
    imgId: pic(1), stock: 120,
  },
  {
    sku: 'NS-D-005', name: 'Luxating Root Elevator Set (4-Piece)', categorySlug: 'dental-instruments', subcategorySlug: 'dental-elevators', price: 89, compareAt: 110,
    description: 'Ultra-thin sharpened tips for severing periodontal ligament fibers prior to tooth extraction.',
    imgId: pic(0), stock: 34,
  },

  // Surgical Scissors
  {
    sku: 'NS-SS-001', name: 'Metzenbaum Dissecting Scissors, Curved 18 cm', categorySlug: 'surgical-scissors', subcategorySlug: 'dissecting-scissors', price: 38, compareAt: null,
    description: 'Fine curved-blade dissecting scissors for delicate tissue separation and blunt dissection.',
    imgId: pic(2), stock: 64,
  },
  {
    sku: 'NS-SS-002', name: 'Iris Scissors, Straight 11.5 cm', categorySlug: 'surgical-scissors', subcategorySlug: 'micro-iris-scissors', price: 24, compareAt: null,
    description: 'Compact, sharp-pointed scissors for fine ophthalmic and micro-surgical trimming.',
    imgId: pic(3), stock: 71,
  },
  {
    sku: 'NS-SS-003', name: 'Mayo Scissors, Curved 17 cm', categorySlug: 'surgical-scissors', subcategorySlug: 'operating-mayo-scissors', price: 32, compareAt: 40,
    description: 'Heavy-duty curved scissors for cutting sutures, fascia, and dense connective tissue.',
    imgId: pic(2), stock: 28,
  },
  {
    sku: 'NS-SS-004', name: 'Suture Removal Scissors, Fine Tip', categorySlug: 'surgical-scissors', subcategorySlug: 'micro-iris-scissors', price: 22, compareAt: null,
    description: 'Angled fine-tip scissors purpose-built for safe, controlled suture removal.',
    imgId: pic(3), stock: 95,
  },

  // Forceps & Clamps
  {
    sku: 'NS-FC-001', name: 'Adson Tissue Forceps, 1x2 Teeth 12 cm', categorySlug: 'forceps-clamps', subcategorySlug: 'tissue-dressing-forceps', price: 18.5, compareAt: null,
    description: 'Fine-toothed tissue forceps for secure, atraumatic tissue handling during closure.',
    imgId: pic(4), stock: 130,
  },
  {
    sku: 'NS-FC-002', name: 'DeBakey Atraumatic Forceps, 20 cm', categorySlug: 'forceps-clamps', subcategorySlug: 'tissue-dressing-forceps', price: 29, compareAt: null,
    description: 'Fine longitudinal serrations grip vessels and delicate tissue without crushing.',
    imgId: pic(5), stock: 55,
  },
  {
    sku: 'NS-FC-003', name: 'Kocher Artery Forceps, Curved 14 cm', categorySlug: 'forceps-clamps', subcategorySlug: 'hemostatic-artery-clamps', price: 26, compareAt: 33,
    description: 'Fully serrated jaws with interlocking teeth for a positive, secure clamp on vessels and tissue.',
    imgId: pic(4), stock: 41,
  },
  {
    sku: 'NS-FC-004', name: 'Backhaus Towel Clamp, 13 cm', categorySlug: 'forceps-clamps', subcategorySlug: 'towel-clamps-retractors', price: 15, compareAt: null,
    description: 'Sharp-tipped clamp for securely fastening surgical drapes and towels.',
    imgId: pic(5), stock: 88,
  },

  // Orthopedic Sets
  {
    sku: 'NS-OR-001', name: 'Freer Periosteal Elevator Set (5-Piece)', categorySlug: 'orthopedic-sets', subcategorySlug: 'periosteal-elevators', price: 210, compareAt: null,
    description: 'Five hand-sharpened blade profiles for periosteal elevation and soft-tissue dissection.',
    imgId: pic(6), stock: 22,
  },
  {
    sku: 'NS-OR-002', name: 'Bone Curette Set (8-Piece)', categorySlug: 'orthopedic-sets', subcategorySlug: 'bone-curettes-chisels', price: 265, compareAt: null,
    description: 'Sharp-edged bone curettes in 8 cup sizes for debridement, grafting, and cyst removal.',
    imgId: pic(7), stock: 18,
  },
  {
    sku: 'NS-OR-003', name: 'Orthopedic Osteotome Set (6-Piece)', categorySlug: 'orthopedic-sets', subcategorySlug: 'bone-curettes-chisels', price: 340, compareAt: null,
    description: 'Straight and curved osteotomes for controlled bone sectioning across widths.',
    imgId: pic(6), stock: 14,
  },
  {
    sku: 'NS-OR-004', name: 'Bone Holding Forceps Set (4-Piece)', categorySlug: 'orthopedic-sets', subcategorySlug: 'bone-holding-forceps', price: 198, compareAt: 249,
    description: 'Self-retaining bone clamps in four grip profiles for fracture reduction and fixation.',
    imgId: pic(7), stock: 12,
  },

  // Implant Kits
  {
    sku: 'NS-IK-001', name: 'Complete Dental Implant Surgical Kit (28-Piece)', categorySlug: 'implant-kits', subcategorySlug: 'implant-placement-systems', price: 895, compareAt: null,
    description: 'Every instrument for a single or multi-implant placement, in a colour-coded sterile tray.',
    imgId: pic(7), stock: 9,
  },
  {
    sku: 'NS-IK-002', name: 'Sinus Lift & Bone Graft Kit (18-Piece)', categorySlug: 'implant-kits', subcategorySlug: 'sinus-lift-bone-grafting', price: 612, compareAt: null,
    description: 'Lateral window and crestal-approach sinus elevation kit with bone graft condensers.',
    imgId: pic(7), stock: 11,
  },
  {
    sku: 'NS-IK-003', name: 'Universal Torque Wrench & Driver Set', categorySlug: 'implant-kits', subcategorySlug: 'torque-wrenches-drivers', price: 215, compareAt: null,
    description: 'Calibrated torque wrench with a full complement of hex and square drivers.',
    imgId: pic(6), stock: 26,
  },

  // Liposuction Cannula
  {
    sku: 'NS-LIPO-001', name: 'Multi-Port Fat Harvesting Cannula Set (5-Piece)', categorySlug: 'liposuction-cannula', subcategorySlug: 'harvesting-cannula', price: 285, compareAt: 330,
    description: 'Tungsten carbide coated multi-port cannulas engineered for gentle fat harvesting.',
    imgId: pic(1), stock: 29,
  },
  {
    sku: 'NS-LIPO-002', name: 'Tumescent Infiltration Cannula Set', categorySlug: 'liposuction-cannula', subcategorySlug: 'infiltration-cannula', price: 145, compareAt: null,
    description: 'Smooth bullet-tip infiltration needles designed for uniform anesthetic distribution.',
    imgId: pic(0), stock: 48,
  },

  // Neurosurgery - Spinal
  {
    sku: 'NS-NEURO-001', name: 'Spinal Micro Dissector Set (7-Piece)', categorySlug: 'neurosurgery-spinal-instruments', subcategorySlug: 'spinal-dissectors', price: 490, compareAt: null,
    description: 'Bayonet micro dissectors and dura elevators for anterior/posterior spinal procedures.',
    imgId: pic(3), stock: 15,
  },
  {
    sku: 'NS-NEURO-002', name: 'Kerrison Laminectomy Rongeur 40° 3mm', categorySlug: 'neurosurgery-spinal-instruments', subcategorySlug: 'kerrison-rongeurs', price: 380, compareAt: null,
    description: 'Precision German stainless steel bone punch with smooth ejector mechanism.',
    imgId: pic(2), stock: 19,
  },

  // Plastic Surgery
  {
    sku: 'NS-PLAST-001', name: 'Tungsten Carbide Rhinoplasty Rasp Set', categorySlug: 'plastic-surgery-instruments', subcategorySlug: 'rhinoplasty-rasps', price: 320, compareAt: null,
    description: 'Double-ended nasal rasps with ultra-sharp TC teeth for smooth bone contouring.',
    imgId: pic(5), stock: 22,
  },
  {
    sku: 'NS-PLAST-002', name: 'Fiberoptic Facelift Retractor with Light Guide', categorySlug: 'plastic-surgery-instruments', subcategorySlug: 'facelift-retractors', price: 440, compareAt: 510,
    description: 'Self-retaining illuminated retractor providing clear visualization during SMAS facelifts.',
    imgId: pic(4), stock: 16,
  },

  // Custom OEM Sets
  {
    sku: 'NS-OEM-001', name: 'OEM Sample Development Kit', categorySlug: 'custom-oem-sets', subcategorySlug: 'private-label-kits', price: 899, compareAt: null,
    description: 'A working sample run to validate geometry, finish, and branding before full production.',
    imgId: pic(6), stock: 30,
  },
  {
    sku: 'NS-OEM-002', name: 'Private Label Starter Bundle (50-Piece, Mixed)', categorySlug: 'custom-oem-sets', subcategorySlug: 'private-label-kits', price: 2450, compareAt: null,
    description: 'A mixed 50-piece production run branded fully to your private label specification.',
    imgId: pic(7), stock: 6,
  },
  {
    sku: 'NS-OEM-003', name: 'Custom Laser-Engraved Branding Add-On', categorySlug: 'custom-oem-sets', subcategorySlug: 'laser-etching-trays', price: 350, compareAt: null,
    description: 'Add your logo, SKU, and UDI marking to any instrument order via precision laser etching.',
    imgId: pic(6), stock: 40,
  },
];

export async function seed(knex: Knex): Promise<void> {
  console.log('Seeding StoreCo Surgical E-Commerce catalog with categories, subcategories & products...');

  const catMap: Record<string, number> = {};

  // 1. Seed Parent Categories & Subcategories
  for (const cat of CATEGORIES) {
    let parentId: number;
    const existingParent = await knex('categories').where({ slug: cat.slug }).first();
    
    if (existingParent) {
      parentId = existingParent.id;
      await knex('categories').where({ id: parentId }).update({
        name: cat.name,
        description: cat.tagline,
        updated_at: new Date(),
      });
    } else {
      const [id] = await knex('categories').insert({
        name: cat.name,
        slug: cat.slug,
        description: cat.tagline,
        parent_id: null,
        created_at: new Date(),
        updated_at: new Date(),
      });
      parentId = id!;
    }
    catMap[cat.slug] = parentId;

    // Seed Subcategories under parentId
    if (cat.subcategories && cat.subcategories.length > 0) {
      for (const sub of cat.subcategories) {
        const existingSub = await knex('categories').where({ slug: sub.slug }).first();
        let subId: number;
        if (existingSub) {
          subId = existingSub.id;
          await knex('categories').where({ id: subId }).update({
            name: sub.name,
            description: sub.tagline,
            parent_id: parentId,
            updated_at: new Date(),
          });
        } else {
          const [id] = await knex('categories').insert({
            name: sub.name,
            slug: sub.slug,
            description: sub.tagline,
            parent_id: parentId,
            created_at: new Date(),
            updated_at: new Date(),
          });
          subId = id!;
        }
        catMap[sub.slug] = subId;
      }
    }
  }

  // 2. Seed Products and Variants
  for (const p of PRODUCTS) {
    const categoryId = catMap[p.subcategorySlug] || catMap[p.categorySlug];
    const parentCategoryId = catMap[p.categorySlug];
    const productSlug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const existingProd = await knex('products').where({ slug: productSlug }).first();
    let productId: number;

    if (existingProd) {
      productId = existingProd.id;
      await knex('products').where({ id: productId }).update({
        name: p.name,
        description: p.description,
        status: 'active',
        updated_at: new Date(),
      });
    } else {
      const [id] = await knex('products').insert({
        name: p.name,
        slug: productSlug,
        description: p.description,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      });
      productId = id!;
    }

    // Link category joins in product_categories
    if (categoryId) {
      const existingJoin = await knex('product_categories')
        .where({ product_id: productId, category_id: categoryId })
        .first();
      if (!existingJoin) {
        await knex('product_categories').insert({
          product_id: productId,
          category_id: categoryId,
          is_primary: true,
        });
      }
    }

    if (parentCategoryId && parentCategoryId !== categoryId) {
      const existingParentJoin = await knex('product_categories')
        .where({ product_id: productId, category_id: parentCategoryId })
        .first();
      if (!existingParentJoin) {
        await knex('product_categories').insert({
          product_id: productId,
          category_id: parentCategoryId,
          is_primary: false,
        });
      }
    }

    // Seed product variant (pricing, stock, image)
    const variantSku = p.sku;
    const existingVar = await knex('product_variants').where({ sku: variantSku }).first();

    if (existingVar) {
      await knex('product_variants').where({ id: existingVar.id }).update({
        cost_price: Math.round(p.price * 0.4 * 100) / 100,
        selling_price: p.price,
        stock_quantity: p.stock,
        image_url: IMG(p.imgId),
        updated_at: new Date(),
      });
    } else {
      await knex('product_variants').insert({
        product_id: productId,
        sku: variantSku,
        cost_price: Math.round(p.price * 0.4 * 100) / 100,
        selling_price: p.price,
        stock_quantity: p.stock,
        image_url: IMG(p.imgId),
        created_at: new Date(),
        updated_at: new Date(),
      });
    }
  }

  console.log('Seeded StoreCo Surgical product catalog with categories, subcategories & variants successfully!');
}
