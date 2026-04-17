import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// Create PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'portfolio',
  user: process.env.DB_USER || 'portfolio',
  password: process.env.DB_PASSWORD || 'portfolio123',
});

// POST - 登录
export async function POST(request: NextRequest) {
  const client = await pool.connect();
  
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: '用户名和密码不能为空' },
        { status: 400 }
      );
    }

    // 查询管理员
    const result = await client.query(
      'SELECT * FROM admin_users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: '用户名或密码错误' },
        { status: 401 }
      );
    }

    const admin = result.rows[0];

    // 验证密码（简单哈希验证）
    const passwordHash = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');

    if (admin.password_hash !== passwordHash) {
      return NextResponse.json(
        { success: false, error: '用户名或密码错误' },
        { status: 401 }
      );
    }

    // 生成 session token
    const sessionToken = crypto.randomBytes(32).toString('hex');

    // 设置 cookie
    const cookieStore = await cookies();
    
    cookieStore.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    cookieStore.set('admin_user', username, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    // 返回 session token 给客户端存储
    return NextResponse.json({
      success: true,
      data: { 
        username: admin.username,
        sessionToken: sessionToken,
      },
    });
  } catch (error) {
    console.error('登录错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
