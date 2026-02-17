/* ════════════════════════════════════════════════════════════
   RADEO — MinIO Image Configuration
   Admin: Update these URLs from your MinIO bucket/admin panel.
   Format: http://YOUR_MINIO_HOST:9000/BUCKET_NAME/filename.jpg
   All images are public-read from the 'radeo-assets' bucket.
   ════════════════════════════════════════════════════════════ */

const MINIO_BASE = process.env.NEXT_PUBLIC_MINIO_URL || 'http://localhost:9000/radeo-assets';

const IMAGES = {

  /* ── HERO ──────────────────────────────────────────────── */
  hero: {
    main: `${MINIO_BASE}/hero/hero-main.jpg`,
    // Full editorial shoe photo, portrait, 1200×1600px recommended
  },

  /* ── PRODUCT CARDS ─────────────────────────────────────── */
  products: [
    {
      id:    'langham',
      name:  'The Langham',
      tag:   'Oxford · Tan',
      price: '₹ 18,500',
      image: `${MINIO_BASE}/products/langham-oxford-tan.jpg`,
      hover: `${MINIO_BASE}/products/langham-oxford-tan-alt.jpg`,
    },
    {
      id:    'knightsbridge',
      name:  'The Knightsbridge',
      tag:   'Chelsea · Black',
      price: '₹ 22,000',
      image: `${MINIO_BASE}/products/knightsbridge-chelsea-black.jpg`,
      hover: `${MINIO_BASE}/products/knightsbridge-chelsea-black-alt.jpg`,
    },
    {
      id:    'aldgate',
      name:  'The Aldgate',
      tag:   'Derby · Midnight',
      price: '₹ 16,800',
      image: `${MINIO_BASE}/products/aldgate-derby-midnight.jpg`,
      hover: `${MINIO_BASE}/products/aldgate-derby-midnight-alt.jpg`,
    },
    {
      id:    'windsor',
      name:  'The Windsor',
      tag:   'Boot · Cognac',
      price: '₹ 26,500',
      image: `${MINIO_BASE}/products/windsor-boot-cognac.jpg`,
      hover: `${MINIO_BASE}/products/windsor-boot-cognac-alt.jpg`,
    },
  ],

  /* ── CRAFT / BEHIND THE SCENES ─────────────────────────── */
  craft: {
    hands:     `${MINIO_BASE}/craft/artisan-hands-stitching.jpg`,
    workshop:  `${MINIO_BASE}/craft/workshop-overview.jpg`,
    lasting:   `${MINIO_BASE}/craft/shoe-lasting-process.jpg`,
    finishing: `${MINIO_BASE}/craft/hand-burnishing-finish.jpg`,
  },

  /* ── MATERIALS / LEATHERS ──────────────────────────────── */
  materials: [
    {
      name:   'Horween Shell Cordovan',
      origin: 'Chicago, USA · Since 1905',
      image:  `${MINIO_BASE}/materials/horween-shell-cordovan.jpg`,
    },
    {
      name:   'Italian Calf Leather',
      origin: 'Tuscany, Italy · Vegetable Tanned',
      image:  `${MINIO_BASE}/materials/italian-calf-tuscany.jpg`,
    },
    {
      name:   'English Boxcalf',
      origin: 'Walsall, England · Chrome Tanned',
      image:  `${MINIO_BASE}/materials/english-boxcalf-walsall.jpg`,
    },
  ],

  /* ── BRAND / LIFESTYLE ─────────────────────────────────── */
  lifestyle: {
    about: `${MINIO_BASE}/lifestyle/founder-atelier.jpg`,
    store: `${MINIO_BASE}/lifestyle/radeo-store-interior.jpg`,
  },

  /* ── FALLBACK ───────────────────────────────────────────── */
  fallback: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect fill='%23f2ede4' width='800' height='600'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Georgia' font-size='18' fill='%23c9a96e'%3ERADEO%3C/text%3E%3C/svg%3E`,
};

export default IMAGES;
export { MINIO_BASE };
