import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateQuizQuestions } from '@/lib/ai-service'

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
      return NextResponse.json({ success: false, error: 'الجلسة منتهية' }, { status: 401 })
    }

    const body = await request.json()
    const { topic, count = 5, difficulty = 'medium', level } = body as {
      topic: string
      count?: number
      difficulty?: 'easy' | 'medium' | 'hard'
      level?: string
    }

    if (!topic || topic.trim().length < 3) {
      return NextResponse.json({
        success: false,
        error: 'الموضوع قصير جداً. أدخل موضوعاً أطول.'
      }, { status: 400 })
    }

    // Generate quiz questions
    const questions = generateQuizQuestions(topic, Math.min(count, 10), difficulty)

    if (questions.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'لم أتمكن من إنشاء أسئلة. حاول بموضوع مختلف.'
      })
    }

    // Update points
    await db.user.update({
      where: { id: session.user.id },
      data: { points: { increment: 3 } }
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'quiz',
        details: `إنشاء ${count} أسئلة في ${topic}`
      }
    })

    return NextResponse.json({
      success: true,
      questions,
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
