import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateFlashcards } from '@/lib/ai-service'

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
    const { topic, count = 8 } = body as { topic: string; count?: number }

    if (!topic || topic.trim().length < 3) {
      return NextResponse.json({
        success: false,
        error: 'الموضوع قصير جداً. أدخل موضوعاً أطول.'
      })
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

    // Generate flashcards with AI
    const result = await generateFlashcards(topic.trim(), userProfile, Math.min(count, 15))

    if (!result.success || !result.flashcards) {
      return NextResponse.json({
        success: false,
        error: result.error || 'لم أتمكن من إنشاء البطاقات'
      })
    }

    // Update points
    await db.user.update({
      where: { id: user.id },
      data: { points: { increment: 2 } }
    })

    return NextResponse.json({
      success: true,
      flashcards: result.flashcards,
      topic
    })
  } catch (error) {
    console.error('Flashcards error:', error)
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ في إنشاء البطاقات. حاول مرة أخرى.'
    }, { status: 500 })
  }
}
