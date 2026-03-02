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
      include: { user: true }
    })

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ success: false, error: 'الجلسة منتهية' }, { status: 401 })
    }

    const body = await request.json()
    const { topic } = body as { topic: string }

    if (!topic || topic.trim().length < 3) {
      return NextResponse.json({
        success: false,
        error: 'الموضوع قصير جداً. أدخل موضوعاً أطول.'
      })
    }

    // Generate flashcards
    const flashcards = generateFlashcards(topic)

    if (flashcards.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'لم أتمكن من إنشاء بطاقات. حاول بموضوع مختلف.'
      })
    }

    // Update points
    await db.user.update({
      where: { id: session.user.id },
      data: { points: { increment: 2 } }
    })

    return NextResponse.json({
      success: true,
      flashcards,
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
