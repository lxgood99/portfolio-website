import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// POST - 登出
export async function POST() {
  try {
    const cookieStore = await cookies();
    
    cookieStore.delete('admin_session');
    cookieStore.delete('admin_user');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('登出错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
