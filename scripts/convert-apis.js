#!/usr/bin/env node
/**
 * API Converter - Converts Supabase API routes to PostgreSQL
 * 
 * This script converts API route files from Supabase to PostgreSQL
 */

const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, '../src/app/api');

function convertFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  // Replace import statement
  if (content.includes("import { getSupabaseClient } from '@/storage/database/supabase-client'")) {
    content = content.replace(
      "import { getSupabaseClient } from '@/storage/database/supabase-client'",
      "import { db } from '@/storage/database/db'"
    );
    modified = true;
  }

  // Replace .from()... with db.select()/db.selectAll()
  // Pattern: client.from('table').select('*')
  if (content.includes('.from(') && content.includes('.select(')) {
    // Simple select all - db.selectAll(table)
    const selectAllPattern = /const \{ data, error \} = await client\s*\n?\s*\.from\(['"]([^'"]+)['"]\)\s*\.select\(['"]([^'"]+)['"]\)/g;
    content = content.replace(selectAllPattern, (match, table, columns) => {
      modified = true;
      return `const result = await db.selectAll('${table}', '${columns}')`;
    });

    // Select single - db.select(table)
    const selectSinglePattern = /const \{ data: existing \} = await client\s*\n?\s*\.from\(['"]([^'"]+)['"]\)\s*\.select\(['"]([^'"]+)['"]\)\s*\.maybeSingle\(\)/g;
    content = content.replace(selectSinglePattern, (match, table, columns) => {
      modified = true;
      return `const result = await db.select('${table}', '${columns}')`;
    });

    // Update pattern
    const updatePattern = /const \{ data, error \} = await client\s*\n?\s*\.from\(['"]([^'"]+)['"]\)\s*\.update\(([\s\S]*?)\)\s*\.eq\(['"]([^'"]+)['"],\s*([^)]+)\)\s*\.select\(\)\s*\.single\(\)/g;
    content = content.replace(updatePattern, (match, table, updateData, idKey, idValue) => {
      modified = true;
      return `const result = await db.update('${table}', ${updateData.trim()}, { ${idKey}: ${idValue} })`;
    });

    // Insert pattern
    const insertPattern = /const \{ data, error \} = await client\s*\n?\s*\.from\(['"]([^'"]+)['"]\)\s*\.insert\(([^)]+)\)\s*\.select\(\)\s*\.single\(\)/g;
    content = content.replace(insertPattern, (match, table, insertData) => {
      modified = true;
      return `const result = await db.insert('${table}', ${insertData.trim()})`;
    });

    // Delete pattern
    const deletePattern = /await client\s*\n?\s*\.from\(['"]([^'"]+)['"]\)\s*\.delete\(\)\s*\.eq\(['"]([^'"]+)['"],\s*([^)]+)\)/g;
    content = content.replace(deletePattern, (match, table, idKey, idValue) => {
      modified = true;
      return `await db.delete('${table}', { ${idKey}: ${idValue} })`;
    });
  }

  // Replace data/error checks
  if (content.includes('if (error || !data)')) {
    content = content.replace(/if \(error \|\| !data\)/g, "if (result.error || !result.data)");
    content = content.replace(/if \(error\)/g, "if (result.error)");
    content = content.replace(/\bdata\b(?!\s*=)/g, "result.data");
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Converted: ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file === 'route.ts') {
      convertFile(filePath);
    }
  }
}

console.log('Starting API conversion...');
walkDir(apiDir);
console.log('Conversion complete!');
