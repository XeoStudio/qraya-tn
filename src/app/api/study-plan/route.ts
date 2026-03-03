import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateStudyPlan } from '@/lib/ai-service'

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
    const { subjects, days, hoursPerDay, goal } = body as {
      subjects: string[]
      days: number
      hoursPerDay: number
      goal?: string
    }

    if (!subjects || subjects.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'يرجى إدخال المواد الدراسية'
      }, { status: 400 })
    }

    if (!days || days < 1 || days > 90) {
      return NextResponse.json({
        success: false,
        error: 'عدد الأيام يجب أن يكون بين 1 و 90'
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

    // Generate study plan with AI
    const result = await generateStudyPlan(subjects, days, hoursPerDay, userProfile, goal)

    if (!result.success || !result.plan) {
      return NextResponse.json({
        success: false,
        error: result.error || 'لم أتمكن من إنشاء الخطة'
      })
    }

    // Update points
    await db.user.update({
      where: { id: user.id },
      data: { points: { increment: 5 } }
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: 'study-plan',
        details: `إنشاء خطة ${days} يوم - ${subjects.length} مواد`
      }
    })

    return NextResponse.json({
      success: true,
      studyPlan: result.plan,
      subjects,
      days,
      hoursPerDay
    })
  } catch (error) {
    console.error('Study plan error:', error)
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ في إنشاء الخطة. حاول مرة أخرى.'
    }, { status: 500 })
  }
}
