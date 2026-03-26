import { sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

// 系统表 - 必须保留
export const healthCheck = pgTable("health_check", {
  id: serial().notNull(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
});

// 个人信息表
export const profiles = pgTable("profiles", {
  id: serial().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  title: varchar("title", { length: 200 }),
  bio: text("bio"),
  avatar_key: varchar("avatar_key", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  location: varchar("location", { length: 200 }),
  website: varchar("website", { length: 255 }),
  social_links: jsonb("social_links").$type<{
    github?: string;
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    [key: string]: string | undefined;
  }>(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// 工作经历表
export const workExperiences = pgTable(
  "work_experiences",
  {
    id: serial().primaryKey(),
    company: varchar("company", { length: 200 }).notNull(),
    position: varchar("position", { length: 200 }).notNull(),
    description: text("description"),
    start_date: varchar("start_date", { length: 20 }).notNull(),
    end_date: varchar("end_date", { length: 20 }),
    location: varchar("location", { length: 200 }),
    order: integer("order").notNull().default(0),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("work_experiences_order_idx").on(table.order)]
);

// 教育经历表
export const educations = pgTable(
  "educations",
  {
    id: serial().primaryKey(),
    school: varchar("school", { length: 200 }).notNull(),
    degree: varchar("degree", { length: 200 }).notNull(),
    field: varchar("field", { length: 200 }),
    start_date: varchar("start_date", { length: 20 }).notNull(),
    end_date: varchar("end_date", { length: 20 }),
    description: text("description"),
    order: integer("order").notNull().default(0),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("educations_order_idx").on(table.order)]
);

// 技能表
export const skills = pgTable(
  "skills",
  {
    id: serial().primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    level: integer("level").default(80),
    category: varchar("category", { length: 100 }),
    order: integer("order").notNull().default(0),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("skills_category_idx").on(table.category),
    index("skills_order_idx").on(table.order),
  ]
);

// 作品集表
export const works = pgTable(
  "works",
  {
    id: serial().primaryKey(),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 100 }),
    tags: jsonb("tags").$type<string[]>(),
    order: integer("order").notNull().default(0),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("works_category_idx").on(table.category),
    index("works_order_idx").on(table.order),
  ]
);

// 作品项表（一个作品可以有多个文件）
export const workItems = pgTable(
  "work_items",
  {
    id: serial().primaryKey(),
    work_id: integer("work_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 20 }).notNull(), // 'pdf', 'image', 'video'
    title: varchar("title", { length: 200 }),
    file_key: varchar("file_key", { length: 255 }).notNull(),
    description: text("description"),
    order: integer("order").notNull().default(0),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("work_items_work_id_idx").on(table.work_id),
    index("work_items_type_idx").on(table.type),
    index("work_items_order_idx").on(table.order),
  ]
);

// 管理员用户表
export const adminUsers = pgTable(
  "admin_users",
  {
    id: serial().primaryKey(),
    username: varchar("username", { length: 100 }).notNull().unique(),
    password_hash: varchar("password_hash", { length: 255 }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("admin_users_username_idx").on(table.username)]
);

// 类型导出
export type Profile = typeof profiles.$inferSelect;
export type WorkExperience = typeof workExperiences.$inferSelect;
export type Education = typeof educations.$inferSelect;
export type Skill = typeof skills.$inferSelect;
export type Work = typeof works.$inferSelect;
export type WorkItem = typeof workItems.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
