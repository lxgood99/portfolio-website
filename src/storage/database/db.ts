// Database adapter for PostgreSQL
// This module provides a unified interface for all database operations

import { Pool, QueryResult, QueryResultRow } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || process.env.DATABASE_PORT || '5432'),
  database: process.env.DB_NAME || process.env.DATABASE_NAME || 'portfolio',
  user: process.env.DB_USER || process.env.DATABASE_USER || 'portfolio',
  password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || 'portfolio123',
});

export interface DbRow extends QueryResultRow {
  [key: string]: unknown;
}

export interface DbResult<T extends DbRow = DbRow> {
  data: T | T[] | null;
  error: { message: string } | null;
}

class DatabaseAdapter {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async query<T extends DbRow = DbRow>(
    sql: string,
    params?: unknown[]
  ): Promise<QueryResult<T>> {
    const client = await this.pool.connect();
    try {
      return await client.query<T>(sql, params);
    } finally {
      client.release();
    }
  }

  // SELECT query - returns first row
  async select<T extends DbRow = DbRow>(
    table: string,
    columns: string = '*',
    where?: Record<string, unknown>,
    options?: { orderBy?: string; limit?: number }
  ): Promise<DbResult<T>> {
    try {
      let sql = `SELECT ${columns} FROM ${table}`;
      const values: unknown[] = [];
      
      if (where && Object.keys(where).length > 0) {
        const conditions: string[] = [];
        let idx = 1;
        for (const [key, value] of Object.entries(where)) {
          if (value === null) {
            conditions.push(`${key} IS NULL`);
          } else if (Array.isArray(value)) {
            conditions.push(`${key} = $${idx}`);
            values.push(value[0]);
          } else {
            conditions.push(`${key} = $${idx}`);
            values.push(value);
          }
          idx++;
        }
        sql += ` WHERE ${conditions.join(' AND ')}`;
      }

      if (options?.orderBy) {
        sql += ` ORDER BY ${options.orderBy}`;
      }

      if (options?.limit) {
        sql += ` LIMIT ${options.limit}`;
      }

      const result = await this.query<T>(sql, values);
      return {
        data: result.rows[0] || null,
        error: null,
      };
    } catch (err) {
      return {
        data: null,
        error: { message: err instanceof Error ? err.message : 'Query error' },
      };
    }
  }

  // SELECT ALL query
  async selectAll<T extends DbRow = DbRow>(
    table: string,
    columns: string = '*',
    where?: Record<string, unknown>,
    options?: { orderBy?: string }
  ): Promise<DbResult<T>> {
    try {
      let sql = `SELECT ${columns} FROM ${table}`;
      const values: unknown[] = [];
      
      if (where && Object.keys(where).length > 0) {
        const conditions: string[] = [];
        let idx = 1;
        for (const [key, value] of Object.entries(where)) {
          if (value === null) {
            conditions.push(`${key} IS NULL`);
          } else {
            conditions.push(`${key} = $${idx}`);
            values.push(value);
          }
          idx++;
        }
        sql += ` WHERE ${conditions.join(' AND ')}`;
      }

      if (options?.orderBy) {
        sql += ` ORDER BY ${options.orderBy}`;
      }

      const result = await this.query<T>(sql, values);
      return {
        data: result.rows,
        error: null,
      };
    } catch (err) {
      return {
        data: null,
        error: { message: err instanceof Error ? err.message : 'Query error' },
      };
    }
  }

  // INSERT query
  async insert<T extends DbRow = DbRow>(
    table: string,
    data: Record<string, unknown>
  ): Promise<DbResult<T>> {
    try {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      
      const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
      const result = await this.query<T>(sql, values);
      
      return {
        data: result.rows[0] || null,
        error: null,
      };
    } catch (err) {
      return {
        data: null,
        error: { message: err instanceof Error ? err.message : 'Insert error' },
      };
    }
  }

  // UPDATE query
  async update<T extends DbRow = DbRow>(
    table: string,
    data: Record<string, unknown>,
    where: Record<string, unknown>
  ): Promise<DbResult<T>> {
    try {
      const setClause: string[] = [];
      const values: unknown[] = [];
      let idx = 1;

      for (const [key, value] of Object.entries(data)) {
        setClause.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
      }

      const whereClause: string[] = [];
      for (const [key, value] of Object.entries(where)) {
        whereClause.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
      }

      const sql = `UPDATE ${table} SET ${setClause.join(', ')} WHERE ${whereClause.join(' AND ')} RETURNING *`;
      const result = await this.query<T>(sql, values);
      
      return {
        data: result.rows[0] || null,
        error: null,
      };
    } catch (err) {
      return {
        data: null,
        error: { message: err instanceof Error ? err.message : 'Update error' },
      };
    }
  }

  // DELETE query
  async delete(
    table: string,
    where: Record<string, unknown>
  ): Promise<{ error: { message: string } | null }> {
    try {
      const whereClause: string[] = [];
      const values: unknown[] = [];
      let idx = 1;

      for (const [key, value] of Object.entries(where)) {
        whereClause.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
      }

      const sql = `DELETE FROM ${table} WHERE ${whereClause.join(' AND ')}`;
      await this.query(sql, values);
      
      return { error: null };
    } catch (err) {
      return {
        error: { message: err instanceof Error ? err.message : 'Delete error' },
      };
    }
  }

  // COUNT query
  async count(
    table: string,
    where?: Record<string, unknown>
  ): Promise<number> {
    try {
      let sql = `SELECT COUNT(*) as count FROM ${table}`;
      const values: unknown[] = [];

      if (where && Object.keys(where).length > 0) {
        const conditions: string[] = [];
        let idx = 1;
        for (const [key, value] of Object.entries(where)) {
          conditions.push(`${key} = $${idx}`);
          values.push(value);
          idx++;
        }
        sql += ` WHERE ${conditions.join(' AND ')}`;
      }

      const result = await this.query<{ count: string }>(sql, values);
      return parseInt(result.rows[0]?.count || '0', 10);
    } catch {
      return 0;
    }
  }
}

export const db = new DatabaseAdapter(pool);
export { pool };
