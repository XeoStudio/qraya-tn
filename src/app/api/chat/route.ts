import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { chat, type ChatMessage } from '@/lib/ai-service'

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
      return NextResponse.json({ success: false, error: 'الجلسة منتهية، يرجى تسجيل الدخول مجدداً' }, { status: 401 })
    }

    const body = await request.json()
    const {
      message,
      history = [],
      enableWebSearch = false,
      agentMode = false
    } = body as {
      message: string
      history?: ChatMessage[]
      enableWebSearch?: boolean
      agentMode?: boolean
    }

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'الرسالة مطلوبة' }, { status: 400 })
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

    // Agent mode enhances the response
    const agentPrompt = agentMode ? `
[وضع الوكيل الذكي مفعّل]
قدم رداً شاملاً ومفصلاً يتضمن:
- شرح عميق ومفصل
- أمثلة عملية متعددة
- خطوات واضحة إن أمكن
- نصائح وتوصيات
- ملخص في النهاية
` : ''

    const enhancedMessage = agentMode ? agentPrompt + '\n\n' + message : message

    // Get AI response with user context (fast timeout)
    const response = await chat(enhancedMessage.trim(), userProfile, {
      history,
      enableWebSearch: enableWebSearch || user.subscription?.advancedAI || false,
      thinking: false // Disable thinking for faster responses
    })

    if (!response.success) {
      return NextResponse.json({
        success: false,
        error: response.error || 'حدث خطأ في الاتصال بالذكاء الاصطناعي'
      }, { status: 500 })
    }

    // Update user points and last active (async, don't wait)
    db.user.update({
      where: { id: user.id },
      data: {
        points: { increment: 1 },
        lastActive: new Date()
      }
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      response: response.content,
      sources: response.sources
    })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ في معالجة الرسالة'
    }, { status: 500 })
  }
}
