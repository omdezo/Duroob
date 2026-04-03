/**
 * Duroob Database Seed Script
 *
 * Reads destination data from src/data/destinations.ts and logs
 * what would be inserted into each table.
 *
 * Run with: npx tsx src/db/seed.ts
 */

import { DESTINATIONS } from '../data/destinations';

// ─── REGION SEED DATA ───────────────────────────────────────────────────────
const REGIONS = [
  { slug: 'muscat', nameEn: 'Muscat', nameAr: 'مسقط', latCenter: 23.5880, lngCenter: 58.3829 },
  { slug: 'dakhiliya', nameEn: 'Ad Dakhiliya', nameAr: 'الداخلية', latCenter: 22.9333, lngCenter: 57.5300 },
  { slug: 'sharqiya', nameEn: 'Ash Sharqiya', nameAr: 'الشرقية', latCenter: 22.5000, lngCenter: 59.0000 },
  { slug: 'dhofar', nameEn: 'Dhofar', nameAr: 'ظفار', latCenter: 17.0151, lngCenter: 54.0924 },
  { slug: 'batinah', nameEn: 'Al Batinah', nameAr: 'الباطنة', latCenter: 23.4000, lngCenter: 57.6000 },
  { slug: 'dhahira', nameEn: 'Ad Dhahira', nameAr: 'الظاهرة', latCenter: 23.3000, lngCenter: 56.6000 },
];

// ─── CATEGORY SEED DATA ─────────────────────────────────────────────────────
const CATEGORIES = [
  { slug: 'culture', nameEn: 'Culture & Heritage', nameAr: 'ثقافة وتراث', icon: 'landmark' },
  { slug: 'nature', nameEn: 'Nature', nameAr: 'طبيعة', icon: 'trees' },
  { slug: 'beach', nameEn: 'Beach', nameAr: 'شاطئ', icon: 'waves' },
  { slug: 'mountain', nameEn: 'Mountain', nameAr: 'جبل', icon: 'mountain' },
  { slug: 'desert', nameEn: 'Desert', nameAr: 'صحراء', icon: 'sun' },
  { slug: 'food', nameEn: 'Food & Dining', nameAr: 'مأكولات ومطاعم', icon: 'utensils' },
];

// Build a region slug → index map for foreign key references
const regionSlugToId = new Map<string, number>();
REGIONS.forEach((r, i) => regionSlugToId.set(r.slug, i + 1));

// Build a category slug → index map for foreign key references
const categorySlugToId = new Map<string, number>();
CATEGORIES.forEach((c, i) => categorySlugToId.set(c.slug, i + 1));

// ─── LOG REGIONS ────────────────────────────────────────────────────────────
console.log('='.repeat(60));
console.log('REGIONS — would insert %d rows', REGIONS.length);
console.log('='.repeat(60));
for (const region of REGIONS) {
  console.log(
    '  [%s] %s / %s  (center: %f, %f)',
    region.slug,
    region.nameEn,
    region.nameAr,
    region.latCenter,
    region.lngCenter,
  );
}

// ─── LOG CATEGORIES ─────────────────────────────────────────────────────────
console.log('\n' + '='.repeat(60));
console.log('CATEGORIES — would insert %d rows', CATEGORIES.length);
console.log('='.repeat(60));
for (const cat of CATEGORIES) {
  console.log('  [%s] %s / %s  icon: %s', cat.slug, cat.nameEn, cat.nameAr, cat.icon);
}

// ─── LOG DESTINATIONS ───────────────────────────────────────────────────────
console.log('\n' + '='.repeat(60));
console.log('DESTINATIONS — would insert %d rows', DESTINATIONS.length);
console.log('='.repeat(60));

const destinationCategoryRows: { destinationId: string; categoryId: number }[] = [];
const destinationMonthRows: { destinationId: string; month: number }[] = [];

for (const d of DESTINATIONS) {
  const regionId = regionSlugToId.get(d.region.en) ?? null;

  console.log(
    '  [%s] %s / %s  region=%s(id:%s)  lat=%f  lng=%f  cost=%f OMR  crowd=%d  visit=%d min',
    d.id,
    d.name.en,
    d.name.ar,
    d.region.en,
    regionId,
    d.lat,
    d.lng,
    d.ticket_cost_omr,
    d.crowd_level,
    d.avg_visit_duration_minutes,
  );

  // Collect M2M category rows
  for (const catSlug of d.categories) {
    const categoryId = categorySlugToId.get(catSlug);
    if (categoryId) {
      destinationCategoryRows.push({ destinationId: d.id, categoryId });
    }
  }

  // Collect M2M month rows
  for (const month of d.recommended_months) {
    destinationMonthRows.push({ destinationId: d.id, month });
  }
}

// ─── LOG DESTINATION_CATEGORIES ─────────────────────────────────────────────
console.log('\n' + '='.repeat(60));
console.log('DESTINATION_CATEGORIES — would insert %d rows', destinationCategoryRows.length);
console.log('='.repeat(60));
for (const row of destinationCategoryRows) {
  console.log('  destination=%s  category_id=%d', row.destinationId, row.categoryId);
}

// ─── LOG DESTINATION_MONTHS ─────────────────────────────────────────────────
console.log('\n' + '='.repeat(60));
console.log('DESTINATION_MONTHS — would insert %d rows', destinationMonthRows.length);
console.log('='.repeat(60));
for (const row of destinationMonthRows) {
  console.log('  destination=%s  month=%d', row.destinationId, row.month);
}

// ─── SUMMARY ────────────────────────────────────────────────────────────────
console.log('\n' + '='.repeat(60));
console.log('SEED SUMMARY');
console.log('='.repeat(60));
console.log('  Regions:                %d', REGIONS.length);
console.log('  Categories:             %d', CATEGORIES.length);
console.log('  Destinations:           %d', DESTINATIONS.length);
console.log('  Destination-Categories: %d', destinationCategoryRows.length);
console.log('  Destination-Months:     %d', destinationMonthRows.length);
console.log('\nDry run complete. Connect a database and replace console.log with db.insert() calls.');
