import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateQuiz } from '@/lib/ai-service'

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
    const { topic, count = 5, difficulty = 'medium' } = body as {
      topic: string
      count?: number
      difficulty?: 'easy' | 'medium' | 'hard'
    }

    if (!topic || topic.trim().length < 3) {
      return NextResponse.json({
        success: false,
        error: 'الموضوع قصير جداً. أدخل موضوعاً أطول.'
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

    // Generate quiz with AI
    const result = await generateQuiz(topic.trim(), userProfile, {
      count: Math.min(count, 15),
      difficulty
    })

    if (!result.success || !result.questions) {
      return NextResponse.json({
        success: false,
        error: result.error || 'لم أتمكن من إنشاء الأسئلة'
      })
    }

    // Update points
    await db.user.update({
      where: { id: user.id },
      data: { points: { increment: 3 } }
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: 'quiz',
        details: `إنشاء ${count} أسئلة في ${topic}`
      }
    })

    return NextResponse.json({
      success: true,
      questions: result.questions,
      topic,
      difficulty
    })
  } catch (error) {
    console.error('Quiz error:', error)
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ في إنشاء الأسئلة. حاول مرة أخرى.'
    }, { status: 500 })
  }
}
