import { integer, pgTable, text } from 'drizzle-orm/pg-core';
export const church = pgTable('church', { id: text('id').primaryKey(), data: text('data').notNull(), revision: integer('revision').notNull().default(0) });
export const accounts = pgTable('accounts', {
 id:text('id').primaryKey(),email:text('email').notNull().unique(),userId:text('user_id').unique(),name:text('name').notNull(),role:text('role').notNull(),cell:text('cell'),sector:text('sector'),person:text('person').unique(),active:integer('active').notNull().default(1),
});
export const devotions = pgTable('devotions', {
 id:text('id').primaryKey(),author:text('author').notNull(),person:text('person').notNull(),cell:text('cell').notNull(),book:text('book').notNull(),chapter:integer('chapter').notNull(),reflection:text('reflection').notNull(),application:text('application').notNull().default(''),date:text('date').notNull(),reviewedBy:text('reviewed_by'),feedback:text('feedback').notNull().default(''),reviewedAt:text('reviewed_at'),
});
export const study = pgTable('study', {userId:text('user_id').primaryKey(),data:text('data').notNull(),revision:integer('revision').notNull().default(0)});
export const credentials = pgTable('credentials',{account:text('account').primaryKey(),username:text('username').notNull().unique(),salt:text('salt').notNull(),hash:text('hash').notNull(),mustChange:integer('must_change').notNull().default(1)});
export const sessions = pgTable('sessions',{token:text('token').primaryKey(),account:text('account').notNull(),expires:integer('expires').notNull()});
export const invites = pgTable('invites',{token:text('token').primaryKey(),cell:text('cell').notNull(),createdBy:text('created_by').notNull(),expires:integer('expires').notNull(),active:integer('active').notNull().default(1)});
export const attempts = pgTable('attempts',{key:text('key').primaryKey(),count:integer('count').notNull().default(0)});
