import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateSummary } from '@/lib/ai-service'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ success: false, error: 'يرجى تسجيل الدخول أولاً' }, { status: 401 })
    }

    const session = await db.session.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({
        success: false,
        error: 'الجلسة منتهية، يرجى تسجيل الدخول مجدداً'
      }, { status: 401 })
    }

    const body = await request.json()
    const { content, level } = body as { content: string; level?: string }

    if (!content || content.trim().length < 10) {
      return NextResponse.json({
        success: false,
        error: 'المحتوى قصير جداً. أدخل نصاً أطول للتلخيص.'
      }, { status: 400 })
    }

    // Generate summary
    const summary = generateSummary(content, level || session.user.levelName || undefined)

    // Update points
    await db.user.update({
      where: { id: session.user.id },
      data: { points: { increment: 2 } }
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'summarize',
        details: `تلخيص محتوى (${content.length} حرف)`
      }
    })

    return NextResponse.json({ success: true, summary })
  } catch (error) {
    console.error('Summarize error:', error)
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ في التلخيص. حاول مرة أخرى.'
    }, { status: 500 })
  }
}
