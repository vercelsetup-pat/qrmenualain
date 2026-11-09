import type { RequestHandler } from '@sveltejs/kit';

import { db } from '#lib/server/db/index.ts';
import { categories } from '#lib/server/db/schema.ts';

export const GET: RequestHandler = async () => {
    const result = await db.select().from(categories);

    return Response.json(result);
};

export const POST: RequestHandler = async ({ request }) => {
    const body: { name: string } = await request.json();

    const [newCategory] = await db
        .insert(categories)
        .values({ name: body.name })
        .returning();

    return Response.json(newCategory, { status: 201 });
};