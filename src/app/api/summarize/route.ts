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
      include: {
        user: {
          include: { subscription: true }
        }
      }
    })

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({
        success: false,
        error: 'الجلسة منتهية، يرجى تسجيل الدخول مجدداً'
      }, { status: 401 })
    }

    const body = await request.json()
    const { content } = body as { content: string }

    if (!content || content.trim().length < 10) {
      return NextResponse.json({
        success: false,
        error: 'المحتوى قصير جداً. أدخل نصاً أطول للتلخيص.'
      }, { status: 400 })
    }

    const user = session.user

    // Build user profile
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

    // Generate summary with AI
    const result = await generateSummary(content.trim(), userProfile)

    if (!result.success || !result.summary) {
      return NextResponse.json({
        success: false,
        error: result.error || 'لم أتمكن من تلخيص المحتوى'
      })
    }

    // Update points
    await db.user.update({
      where: { id: user.id },
      data: { points: { increment: 2 } }
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: 'summarize',
        details: `تلخيص محتوى (${content.length} حرف)`
      }
    })

    return NextResponse.json({
      success: true,
      summary: result.summary
    })
  } catch (error) {
    console.error('Summarize error:', error)
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ في التلخيص. حاول مرة أخرى.'
    }, { status: 500 })
  }
}
