
import { pgTable, serial, varchar, numeric, integer} from 'drizzle-orm/pg-core';

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100}).notNull()
});

export const items = pgTable('items', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 150 }).notNull(),
  price: numeric('price', { precision: 10, scale: 2}).notNull(),
  categoryId: integer('category_id').notNull().references(() => categories.id, { onDelete: 'restrict'})
});
