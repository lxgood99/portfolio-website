import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// POST - 登录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: '用户名和密码不能为空' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 查询管理员
    const { data: admin, error } = await client
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !admin) {
      return NextResponse.json(
        { success: false, error: '用户名或密码错误' },
        { status: 401 }
      );
    }

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

    // 设置登录态（使用 cookie）
    const cookieStore = await cookies();
    const sessionToken = crypto.randomBytes(32).toString('hex');
    
    // 设置 session cookie
    cookieStore.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: false, // 沙箱环境使用 HTTP，必须设为 false
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 天
    });

    // 设置用户名 cookie
    cookieStore.set('admin_user', username, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    // 创建响应并返回
    const response = NextResponse.json({
      success: true,
      data: { username: admin.username },
    });
    
    return response;
  } catch (error) {
    console.error('登录错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
