import { NextResponse } from 'next/server';
import { db } from '@/storage/database/db';

// GET - 获取访问统计
export async function GET() {
  try {
    const result = await db.select('visit_stats');

    if (result.error) {
      throw new Error(`获取访问统计失败: ${result.error.message}`);
    }

    return NextResponse.json({ 
      success: true, 
      data: result.data,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      }
    });
  } catch (error) {
    console.error('获取访问统计错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
