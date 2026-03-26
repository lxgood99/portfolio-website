import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// POST - 登出
export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // 删除 cookie 需要设置相同的 path
    cookieStore.set('admin_session', '', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 0, // 立即过期
    });

    cookieStore.set('admin_user', '', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('登出错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
