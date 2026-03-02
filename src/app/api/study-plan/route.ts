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
      include: { user: { include: { subscription: true } } }
    })

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ success: false, error: 'الجلسة منتهية' }, { status: 401 })
    }

    const body = await request.json()
    const { subjects, days, hoursPerDay, level, goal } = body as {
      subjects: string[]
      days: number
      hoursPerDay: number
      level?: string
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

    // Generate study plan
    const studyPlanContent = generateStudyPlan(subjects, days, hoursPerDay)

    let studyPlan = `## 📚 خطة الدراسة المخصصة\n\n`
    studyPlan += `### معلومات الطالب:\n`
    studyPlan += `- **المواد:** ${subjects.join('، ')}\n`
    studyPlan += `- **المدة:** ${days} يوم\n`
    studyPlan += `- **ساعات الدراسة:** ${hoursPerDay} ساعة يومياً\n`
    if (level) studyPlan += `- **المستوى:** ${level}\n`
    if (goal) studyPlan += `- **الهدف:** ${goal}\n`
    studyPlan += `\n---\n\n`
    studyPlan += studyPlanContent

    // Update points
    await db.user.update({
      where: { id: session.user.id },
      data: { points: { increment: 5 } }
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'study-plan',
        details: `إنشاء خطة ${days} يوم - ${subjects.length} مواد`
      }
    })

    return NextResponse.json({
      success: true,
      studyPlan,
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
