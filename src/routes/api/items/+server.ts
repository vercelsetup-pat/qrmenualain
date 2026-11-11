import { db } from '#lib/server/db/index.ts';
import { items } from '#lib/server/db/schema.ts';
import type { RequestHandler } from '@sveltejs/kit';


// GET /api/items
export const GET: RequestHandler = async () => {
	const rows = await db.select().from(items);
	return Response.json(rows);
};

// POST /api/items  { name, price, categoryId }
export const POST: RequestHandler = async ({ request }) => {
	const { name, price, categoryId } = await request.json();

	const [created] = await db
		.insert(items)
		.values({ name, price: String(price), categoryId })
		.returning();

	return Response.json(created, { status: 201 });
}; 
