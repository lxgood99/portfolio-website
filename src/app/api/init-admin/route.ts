import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/storage/database/db';
import crypto from 'crypto';

// POST - 初始化管理员账户
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

    if (username.length < 3 || password.length < 6) {
      return NextResponse.json(
        { success: false, error: '用户名至少3个字符，密码至少6个字符' },
        { status: 400 }
      );
    }

    // 检查是否已存在管理员
    const existingAdmin = await db.select('admin_users', 'id');

    if (existingAdmin.data) {
      return NextResponse.json(
        { success: false, error: '管理员账户已存在，无法重复初始化' },
        { status: 400 }
      );
    }

    // 创建管理员账户
    const passwordHash = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');

    const result = await db.insert('admin_users', {
      username,
      password_hash: passwordHash,
    });

    if (result.error) {
      throw new Error(`创建管理员失败: ${result.error.message}`);
    }

    return NextResponse.json({
      success: true,
      message: '管理员账户创建成功',
    });
  } catch (error) {
    console.error('初始化管理员错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
