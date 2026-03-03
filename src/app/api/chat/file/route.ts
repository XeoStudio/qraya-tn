import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { chatWithContent, type ChatMessage } from '@/lib/ai-service'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ success: false, error: 'يرجى تسجيل الدخول أولاً' }, { status: 401 })
    }

    const session = await db.session.findUnique({
      where: { token },
      include: {
        user: {
          include: { subscription: true }
        }
      }
    })

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ success: false, error: 'الجلسة منتهية' }, { status: 401 })
    }

    const body = await request.json()
    const {
      message,
      fileName,
      content,
      history = [],
      agentMode = false
    } = body as {
      message: string
      fileName: string
      content: string
      history?: ChatMessage[]
      agentMode?: boolean
    }

    if (!content) {
      return NextResponse.json({ success: false, error: 'المحتوى مطلوب' }, { status: 400 })
    }

    const user = session.user

    // Build user profile for AI
    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      level: user.level,
      levelName: user.levelName,
      year: user.year,
      section: user.section,
      governorate: user.governorate,
      subjects: user.subjects,
      points: user.points,
      streak: user.streak,
      role: user.role,
      subscription: user.subscription ? {
        plan: user.subscription.plan,
        status: user.subscription.status,
        agentMode: user.subscription.agentMode,
        advancedAI: user.subscription.advancedAI
      } : null
    }

    // Agent mode enhancement
    const enhancedMessage = agentMode 
      ? `[تحليل معمق مطلوب]\n${message}`
      : message

    // Get AI response with file content
    const response = await chatWithContent(content, fileName, enhancedMessage, userProfile, {
      history
    })

    if (!response.success) {
      return NextResponse.json({
        success: false,
        error: response.error || 'حدث خطأ في تحليل الملف'
      }, { status: 500 })
    }

    // Update user points (async)
    db.user.update({
      where: { id: user.id },
      data: {
        points: { increment: 2 },
        lastActive: new Date()
      }
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      response: response.content
    })
  } catch (error) {
    console.error('File chat error:', error)
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ في معالجة الملف'
    }, { status: 500 })
  }
}
