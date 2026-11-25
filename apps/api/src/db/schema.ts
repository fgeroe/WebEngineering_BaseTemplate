import {
  index,
  integer,
  pgEnum,
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
    reportCount: integer('report_count').notNull().default(0),
    // set once the comment reached the report limit; hidden comments are
    // no longer listed
    hiddenAt: timestamp('hidden_at', { withTimezone: true, precision: 3 }),
  },
  (table) => [
    index('comments_bear_id_created_at_id_idx').on(
      table.bearId,
      table.createdAt,
      table.id
    ),
  ]
);

// the database itself only accepts these values
export const userRole = pgEnum('user_role', ['user', 'moderator']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  // stored trimmed and lower-cased, so the unique constraint is case-insensitive
  email: text('email').notNull().unique(),
  // argon2id hash incl. algorithm, parameters and salt - never the password
  passwordHash: text('password_hash').notNull(),
  role: userRole('role').notNull().default('user'),
  createdAt: timestamp('created_at', { withTimezone: true, precision: 3 })
    .notNull()
    .defaultNow(),
});
