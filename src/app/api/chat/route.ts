import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { chat } from '@/lib/ai-service'

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
      return NextResponse.json({ success: false, error: 'الجلسة منتهية، يرجى تسجيل الدخول مجدداً' }, { status: 401 })
    }

    const body = await request.json()
    const { message, history = [] } = body as {
      message: string
      history?: Array<{ role: string; content: string }>
    }

    if (!message) {
      return NextResponse.json({ success: false, error: 'الرسالة مطلوبة' }, { status: 400 })
    }

    const user = session.user

    // Get AI response
    const response = await chat(
      message,
      {
        userName: user.name,
        level: user.level,
        levelName: user.levelName,
        year: user.year,
        section: user.section
      },
      history.map(h => ({ role: h.role as 'system' | 'user' | 'assistant', content: h.content }))
    )

    if (!response.success) {
      return NextResponse.json({
        success: false,
        error: response.error || 'حدث خطأ في معالجة الرسالة'
      }, { status: 500 })
    }

    // Update user points and last active
    try {
      await db.user.update({
        where: { id: user.id },
        data: {
          points: { increment: 1 },
          lastActive: new Date()
        }
      })
    } catch {
      // Ignore update errors
    }

    return NextResponse.json({
      success: true,
      response: response.content
    })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ في معالجة الرسالة'
    }, { status: 500 })
  }
}
