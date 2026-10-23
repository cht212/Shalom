import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const church = sqliteTable('church', { id: text('id').primaryKey(), data: text('data').notNull(), revision: integer('revision').notNull().default(0) });
export const accounts = sqliteTable('accounts', {
 id:text('id').primaryKey(),email:text('email').notNull().unique(),userId:text('user_id').unique(),name:text('name').notNull(),role:text('role').notNull(),cell:text('cell'),sector:text('sector'),person:text('person').unique(),active:integer('active').notNull().default(1),
});
export const devotions = sqliteTable('devotions', {
 id:text('id').primaryKey(),author:text('author').notNull(),person:text('person').notNull(),cell:text('cell').notNull(),book:text('book').notNull(),chapter:integer('chapter').notNull(),reflection:text('reflection').notNull(),application:text('application').notNull().default(''),date:text('date').notNull(),reviewedBy:text('reviewed_by'),feedback:text('feedback').notNull().default(''),reviewedAt:text('reviewed_at'),
});
export const study = sqliteTable('study', {userId:text('user_id').primaryKey(),data:text('data').notNull(),revision:integer('revision').notNull().default(0)});
