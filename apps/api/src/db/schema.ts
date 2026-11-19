import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const bears = pgTable('bears', {
  id: text('id').primaryKey(),
  position: integer('position').notNull(),
  name: text('name').notNull(),
  binomial: text('binomial').notNull(),
  imageUrl: text('image_url'),
  range: text('range').notNull(),
  fetchedAt: timestamp('fetched_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const comments = pgTable(
  'comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    bearId: text('bear_id')
      .notNull()
      .references(() => bears.id, { onDelete: 'cascade' }),
    author: varchar('author', { length: 50 }).notNull(),
    text: varchar('text', { length: 1000 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 3 })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('comments_bear_id_created_at_id_idx').on(
      table.bearId,
      table.createdAt,
      table.id
    ),
  ]
);
