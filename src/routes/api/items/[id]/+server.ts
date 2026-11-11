import { db } from '#lib/server/db/index.ts';
import { items } from '#lib/server/db/schema.ts';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from '@sveltejs/kit';

// GET /api/items/:id
export const GET: RequestHandler = async ({ params }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id)) return Response.json({ error: 'Invalid id' }, { status: 400 });

	const [item] = await db.select().from(items).where(eq(items.id, id));
	if (!item) return Response.json({ error: 'Item not found' }, { status: 404 });

	return Response.json(item);
};

// PATCH /api/items/:id  { name?, price?, categoryId? }
export const PATCH: RequestHandler = async ({ params, request }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id)) return Response.json({ error: 'Invalid id' }, { status: 400 });

	const { name, price, categoryId } = await request.json();

	const changes: Partial<typeof items.$inferInsert> = {};
	if (name !== undefined) changes.name = name;
	if (price !== undefined) changes.price = String(price);
	if (categoryId !== undefined) changes.categoryId = categoryId;

	if (Object.keys(changes).length === 0) {
		return Response.json({ error: 'Nothing to update' }, { status: 400 });
	}

	const [updated] = await db.update(items).set(changes).where(eq(items.id, id)).returning();
	if (!updated) return Response.json({ error: 'Item not found' }, { status: 404 });

	return Response.json(updated);
};

// DELETE /api/items/:id
export const DELETE: RequestHandler = async ({ params }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id)) return Response.json({ error: 'Invalid id' }, { status: 400 });

	const [deleted] = await db.delete(items).where(eq(items.id, id)).returning();
	if (!deleted) return Response.json({ error: 'Item not found' }, { status: 404 });

	return new Response(null, { status: 204 });
};