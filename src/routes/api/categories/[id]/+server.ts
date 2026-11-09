
import type { RequestHandler } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { categories } from '#lib/server/db/schema.ts';

// GET SINGLE CATEGORY
export const GET: RequestHandler = async ({ params }) => {
    const id = Number(params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return Response.json(
            { message: 'Invalid category ID' },
            { status: 400 }
        );
    }

    const [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.id, id));

    if (!category) {
        return Response.json(
            { message: 'Category not found' },
            { status: 404 }
        );
    }

    return Response.json(category);
};

// PATCH CATEGORY
export const PATCH: RequestHandler = async ({ params, request }) => {
    const id = Number(params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return Response.json(
            { message: 'Invalid category ID' },
            { status: 400 }
        );
    }

    const body: { name?: string } = await request.json();

    if (!body.name?.trim()) {
        return Response.json(
            { message: 'Category name is required' },
            { status: 400 }
        );
    }

    const [updatedCategory] = await db
        .update(categories)
        .set({ name: body.name.trim() })
        .where(eq(categories.id, id))
        .returning();

    if (!updatedCategory) {
        return Response.json(
            { message: 'Category not found' },
            { status: 404 }
        );
    }

    return Response.json(updatedCategory);
};

// DELETE CATEGORY
export const DELETE: RequestHandler = async ({ params }) => {
    const id = Number(params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return Response.json(
            { message: 'Invalid category ID' },
            { status: 400 }
        );
    }

    const [deletedCategory] = await db
        .delete(categories)
        .where(eq(categories.id, id))
        .returning();

    if (!deletedCategory) {
        return Response.json(
            { message: 'Category not found' },
            { status: 404 }
        );
    }

    return Response.json({
        message: 'Category deleted successfully',
        category: deletedCategory
    });
};
