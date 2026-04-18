/**
 * 数据导入脚本 - 将数据导入到 PostgreSQL
 * 运行: node scripts/import-data.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// PostgreSQL 配置 - 请根据你的服务器配置修改
const pool = new Pool({
  host: process.env.DB_HOST || process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || process.env.DATABASE_PORT || '5432'),
  database: process.env.DB_NAME || process.env.DATABASE_NAME || 'portfolio',
  user: process.env.DB_USER || process.env.DATABASE_USER || 'portfolio',
  password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || 'portfolio123',
});

// 表和字段映射（source -> target）
const tableMapping = {
  profiles: {
    fields: ['id', 'name', 'title', 'bio', 'avatar_key', 'email', 'phone', 'location', 'website', 'social_links', 'custom_title', 'custom_content', 'show_email', 'show_phone', 'show_location', 'show_github', 'show_linkedin', 'show_twitter', 'show_instagram', 'show_custom', 'timeline_title', 'created_at', 'updated_at']
  },
  self_introduction: {
    fields: ['id', 'content', 'is_visible', 'created_at', 'updated_at']
  },
  self_intro_cards: {
    fields: ['id', 'title', 'content', 'icon', 'color', 'order_index', 'created_at', 'updated_at']
  },
  work_experiences: {
    fields: ['id', 'company', 'position', 'description', 'start_date', 'end_date', 'location', 'order', 'image_display_mode', 'description_align', 'created_at', 'updated_at']
  },
  work_experience_images: {
    fields: ['id', 'work_experience_id', 'file_key', 'title', 'order_index', 'created_at', 'updated_at']
  },
  educations: {
    fields: ['id', 'school', 'degree', 'field', 'description', 'start_date', 'end_date', 'order', 'created_at', 'updated_at']
  },
  skills: {
    fields: ['id', 'name', 'level', 'category', 'order', 'description', 'created_at', 'updated_at']
  },
  skill_categories: {
    fields: ['id', 'name', 'is_visible', 'order_index', 'created_at', 'updated_at']
  },
  works: {
    fields: ['id', 'title', 'description', 'category', 'category_id', 'tags', 'cover_image_key', 'display_mode', 'order', 'description_align', 'subtitle', 'created_at', 'updated_at']
  },
  work_items: {
    fields: ['id', 'work_id', 'type', 'file_key', 'title', 'is_carousel_item', 'order_index', 'created_at', 'updated_at']
  },
  work_categories: {
    fields: ['id', 'name', 'is_visible', 'order_index', 'created_at', 'updated_at']
  },
  module_orders: {
    fields: ['id', 'module_name', 'order_index', 'is_visible', 'created_at', 'updated_at']
  },
  contact_info: {
    fields: ['id', 'email', 'phone', 'wechat_qr_key', 'wechat_id', 'is_visible', 'show_email', 'show_phone', 'show_wechat', 'created_at', 'updated_at']
  },
  timeline_items: {
    fields: ['id', 'name', 'start_year', 'start_month', 'end_year', 'end_month', 'color', 'breaks', 'order_index', 'created_at', 'updated_at']
  },
  dev_logs: {
    fields: ['id', 'version', 'title', 'created_at', 'requirements', 'completed_features', 'bug_fixes', 'notes', 'order_index', 'updated_at']
  },
  admin_users: {
    fields: ['id', 'username', 'password_hash', 'created_at']
  }
};

async function importTable(tableName, records) {
  if (!records || (Array.isArray(records) && records.length === 0)) {
    console.log(`跳过 ${tableName} (无数据)`);
    return;
  }

  const mapping = tableMapping[tableName];
  if (!mapping) {
    console.log(`跳过 ${tableName} (无映射配置)`);
    return;
  }

  const client = await pool.connect();
  try {
    // 清空现有数据
    await client.query(`DELETE FROM ${tableName}`);
    console.log(`清空 ${tableName}`);

    // 插入新数据
    const recordsToInsert = Array.isArray(records) ? records : [records];
    
    for (const record of recordsToInsert) {
      const fields = [];
      const values = [];
      const placeholders = [];
      let idx = 1;

      for (const field of mapping.fields) {
        if (field !== 'id' && record[field] !== undefined) {
          fields.push(field);
          values.push(record[field]);
          placeholders.push(`$${idx}`);
          idx++;
        }
      }

      if (fields.length > 0) {
        const sql = `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;
        await client.query(sql, values);
      }
    }

    console.log(`导入 ${tableName}: ${recordsToInsert.length} 条记录 ✓`);
  } catch (error) {
    console.error(`导入 ${tableName} 失败:`, error.message);
  } finally {
    client.release();
  }
}

async function importAll() {
  console.log('开始导入数据到 PostgreSQL...\n');

  // 读取导出数据
  const dataPath = path.join(__dirname, '..', 'exported-data.json');
  if (!fs.existsSync(dataPath)) {
    console.error('错误: 找不到 exported-data.json，请先运行 export-supabase-data.js');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  // 按依赖顺序导入表
  const tableOrder = [
    'admin_users',        // 管理员（无依赖）
    'profiles',           // 个人信息（无依赖）
    'self_introduction',  // 自我评价（无依赖）
    'self_intro_cards',   // 自我评价卡片（无依赖）
    'skill_categories',   // 技能分类（无依赖）
    'skills',             // 技能（依赖 skill_categories）
    'work_categories',    // 作品分类（无依赖）
    'works',              // 作品（依赖 work_categories）
    'work_items',         // 作品文件（依赖 works）
    'educations',         // 教育背景（无依赖）
    'work_experiences',   // 工作经历（无依赖）
    'work_experience_images', // 工作经历图片（依赖 work_experiences）
    'module_orders',      // 模块排序（无依赖）
    'contact_info',       // 联系方式（无依赖）
    'timeline_items',     // 时间线（无依赖）
    'dev_logs'            // 开发日志（无依赖）
  ];

  for (const table of tableOrder) {
    if (data[table]) {
      await importTable(table, data[table]);
    } else {
      console.log(`跳过 ${table} (导出文件中无数据)`);
    }
  }

  console.log('\n导入完成！');
  await pool.end();
}

importAll().catch(console.error);
