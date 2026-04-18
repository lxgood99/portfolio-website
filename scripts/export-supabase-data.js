/**
 * 数据导出脚本 - 从 Supabase 导出所有数据
 * 运行: node scripts/export-data.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Supabase 配置 - 从环境变量获取
const SUPABASE_URL = process.env.COZE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.COZE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('错误: 缺少 Supabase 配置');
  console.log('请确保设置了 COZE_SUPABASE_URL 和 COZE_SUPABASE_ANON_KEY 环境变量');
  process.exit(1);
}

// 要导出的表列表
const tables = [
  'profiles',
  'self_introduction',
  'self_intro_cards',
  'work_experiences',
  'work_experience_images',
  'educations',
  'skills',
  'skill_categories',
  'works',
  'work_items',
  'work_categories',
  'module_orders',
  'contact_info',
  'timeline_items',
  'dev_logs',
  'admin_users'
];

async function fetchTable(tableName) {
  return new Promise((resolve, reject) => {
    const url = `${SUPABASE_URL}/rest/v1/${tableName}?select=*`;
    
    const options = {
      hostname: new URL(SUPABASE_URL).hostname,
      port: 443,
      path: '/rest/v1/' + tableName + '?select=*',
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(data);
          }
        } else {
          console.error(`获取 ${tableName} 失败: ${res.statusCode}`, data);
          resolve(null);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function exportAll() {
  console.log('开始导出数据...\n');
  console.log(`Supabase URL: ${SUPABASE_URL}\n`);

  const data = {};

  for (const table of tables) {
    process.stdout.write(`导出 ${table}... `);
    const result = await fetchTable(table);
    data[table] = result;
    const count = Array.isArray(result) ? result.length : (result ? 1 : 0);
    console.log(`✓ ${count} 条记录`);
  }

  // 保存到文件
  const outputPath = path.join(__dirname, '..', 'exported-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`\n数据已保存到: ${outputPath}`);

  // 打印摘要
  console.log('\n=== 数据摘要 ===');
  for (const [table, records] of Object.entries(data)) {
    const count = Array.isArray(records) ? records.length : (records ? 1 : 0);
    console.log(`${table}: ${count} 条`);
  }
}

exportAll().catch(console.error);
