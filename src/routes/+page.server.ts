import { db } from '#lib/server/db/index.ts';
import { categories, items } from '#lib/server/db/schema.ts';
import type { PageServerLoad } from './$types';
 
// Runs on the server, so the menu arrives already rendered when a QR code is scanned.
export const load: PageServerLoad = async () => {
	const [allCategories, allItems] = await Promise.all([
		db.select().from(categories).orderBy(categories.id),
		db.select().from(items).orderBy(items.id)
	]);
 
	return { categories: allCategories, items: allItems };
};
 