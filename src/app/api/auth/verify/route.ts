import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// GET - 验证登录状态
export async function GET(request: NextRequest) {
  try {
    // 优先从 header 获取 session token
    const authHeader = request.headers.get('Authorization');
    const headerSession = authHeader?.replace('Bearer ', '');
    const headerUser = request.headers.get('X-Admin-User');

    // 如果 header 中有 token，使用 header 验证
    if (headerSession && headerUser) {
      return NextResponse.json({
        success: true,
        data: {
          authenticated: true,
          username: headerUser,
        },
      });
    }

    // 否则从 cookie 获取
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    const username = cookieStore.get('admin_user');

    if (!session || !username) {
      return NextResponse.json({
        success: true,
        data: { authenticated: false },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        authenticated: true,
        username: username.value,
      },
    });
  } catch (error) {
    console.error('验证登录状态错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
