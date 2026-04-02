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
  boolean,
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
  // 显示开关
  show_email: boolean("show_email").default(true),
  show_phone: boolean("show_phone").default(true),
  show_location: boolean("show_location").default(true),
  show_github: boolean("show_github").default(false),
  show_linkedin: boolean("show_linkedin").default(false),
  show_twitter: boolean("show_twitter").default(false),
  show_instagram: boolean("show_instagram").default(false),
  // 自定义栏目
  custom_title: varchar("custom_title", { length: 50 }),
  custom_content: varchar("custom_content", { length: 200 }),
  show_custom: boolean("show_custom").default(false),
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
    description_align: varchar("description_align", { length: 20 }).default('left'), // left, center, right, justify
    start_date: varchar("start_date", { length: 20 }).notNull(),
    end_date: varchar("end_date", { length: 20 }),
    location: varchar("location", { length: 200 }),
    image_display_mode: varchar("image_display_mode", { length: 20 }).default("none"), // 'none', 'grid', 'carousel'
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
    description_align: varchar("description_align", { length: 20 }).default('left'), // left, center, right, justify
    awards: text("awards"), // 奖学金/荣誉
    gpa: varchar("gpa", { length: 50 }), // GPA
    ranking: varchar("ranking", { length: 50 }), // 专业排名
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
    description: text("description"), // 技能补充说明
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

// 技能分类表
export const skillCategories = pgTable(
  "skill_categories",
  {
    id: serial().primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    order: integer("order").notNull().default(0),
    is_visible: boolean("is_visible").default(true),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("skill_categories_order_idx").on(table.order)]
);


// 作品集表
export const works = pgTable(
  "works",
  {
    id: serial().primaryKey(),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    description_align: varchar("description_align", { length: 20 }).default('left'), // left, center, right, justify
    category: varchar("category", { length: 100 }),
    tags: jsonb("tags").$type<string[]>(),
    display_mode: varchar("display_mode", { length: 20 }).default("single"), // 'single', 'carousel', 'combined'
    cover_image_key: varchar("cover_image_key", { length: 255 }),
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
    is_carousel_item: integer("is_carousel_item").default(0), // 轮播图片标记 (0/1)
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

// 自我评价表
export const selfIntroduction = pgTable("self_introduction", {
  id: serial().primaryKey(),
  content: text("content").notNull(),
  is_visible: boolean("is_visible").default(true),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// 工作经历图片表
export const workExperienceImages = pgTable(
  "work_experience_images",
  {
    id: serial().primaryKey(),
    work_experience_id: integer("work_experience_id")
      .notNull()
      .references(() => workExperiences.id, { onDelete: "cascade" }),
    file_key: varchar("file_key", { length: 255 }).notNull(),
    title: varchar("title", { length: 200 }),
    order: integer("order").notNull().default(0),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("work_experience_images_work_id_idx").on(table.work_experience_id),
    index("work_experience_images_order_idx").on(table.order),
  ]
);

// 模块排序表
export const moduleOrders = pgTable(
  "module_orders",
  {
    id: serial().primaryKey(),
    module_name: varchar("module_name", { length: 50 }).notNull().unique(),
    order: integer("order").notNull().default(0),
    is_visible: boolean("is_visible").default(true),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("module_orders_name_idx").on(table.module_name)]
);

// 访问统计表
export const visitStats = pgTable("visit_stats", {
  id: serial().primaryKey(),
  total_visits: integer("total_visits").default(0),
  today_visits: integer("today_visits").default(0),
  last_visit_at: timestamp("last_visit_at", { withTimezone: true }),
  today_date: varchar("today_date", { length: 20 }), // 格式: YYYY-MM-DD
  cumulative_visits: integer("cumulative_visits").default(0), // 累计访问总量（持续累计）
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// 每日访问统计表 - 只保留5天
export const visitDailyStats = pgTable(
  "visit_daily_stats",
  {
    id: serial().primaryKey(),
    date: varchar("date", { length: 20 }).notNull().unique(), // YYYY-MM-DD
    visit_count: integer("visit_count").default(0),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("visit_daily_stats_date_idx").on(table.date)]
);

// 每日IP记录表 - 用于当天去重
export const visitDailyIps = pgTable(
  "visit_daily_ips",
  {
    id: serial().primaryKey(),
    ip_address: varchar("ip_address", { length: 50 }).notNull(),
    visit_date: varchar("visit_date", { length: 20 }).notNull(), // YYYY-MM-DD
    first_visit_at: timestamp("first_visit_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("visit_daily_ips_date_idx").on(table.visit_date),
    index("visit_daily_ips_ip_date_idx").on(table.ip_address, table.visit_date),
  ]
);

// 访问IP记录表 - 用于去重（旧表，保留兼容）
export const visitIpRecords = pgTable(
  "visit_ip_records",
  {
    id: serial().primaryKey(),
    ip_address: varchar("ip_address", { length: 50 }).notNull(),
    first_visit_at: timestamp("first_visit_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("visit_ip_records_ip_idx").on(table.ip_address)]
);

// 联系方式表
export const contactInfo = pgTable("contact_info", {
  id: serial().primaryKey(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  wechat_qr_key: varchar("wechat_qr_key", { length: 255 }),
  wechat_id: varchar("wechat_id", { length: 100 }),
  is_visible: boolean("is_visible").default(true),
  show_email: boolean("show_email").default(true),
  show_phone: boolean("show_phone").default(true),
  show_wechat: boolean("show_wechat").default(true),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// 类型导出
export type Profile = typeof profiles.$inferSelect;
export type WorkExperience = typeof workExperiences.$inferSelect;
export type Education = typeof educations.$inferSelect;
export type Skill = typeof skills.$inferSelect;
export type SkillCategory = typeof skillCategories.$inferSelect;
export type Work = typeof works.$inferSelect;
export type WorkItem = typeof workItems.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
export type SelfIntroduction = typeof selfIntroduction.$inferSelect;
export type WorkExperienceImage = typeof workExperienceImages.$inferSelect;
export type ModuleOrder = typeof moduleOrders.$inferSelect;
export type VisitStats = typeof visitStats.$inferSelect;
export type VisitDailyStats = typeof visitDailyStats.$inferSelect;
export type VisitDailyIp = typeof visitDailyIps.$inferSelect;
export type VisitIpRecord = typeof visitIpRecords.$inferSelect;
export type ContactInfo = typeof contactInfo.$inferSelect;
