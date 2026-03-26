import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// GET - 验证登录状态
export async function GET() {
  try {
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
