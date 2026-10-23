import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const church = sqliteTable('church', { id: text('id').primaryKey(), data: text('data').notNull(), revision: integer('revision').notNull().default(0) });
