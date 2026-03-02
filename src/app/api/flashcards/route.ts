import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

interface Flashcard {
  question: string
  answer: string
}

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
    const { topic, count = 8, level } = body as {
      topic: string
      count?: number
      level?: string
    }
    
    if (!topic || topic.trim().length < 3) {
      return NextResponse.json({ 
        success: false, 
        error: 'الموضوع قصير جداً' 
      }, { status: 400 })
    }
    
    const systemPrompt = `أنت معلم تونسي خبير في إنشاء بطاقات المراجعة للطلاب التونسيين.

## مهمتك:
إنشاء ${count} بطاقة مراجعة (Flashcards) حول الموضوع المحدد.

## قواعد البطاقات:
1. كل بطاقة تحتوي سؤال وإجابة
2. الأسئلة مختصرة وواضحة
3. الإجابات موجزة ومفيدة (1-3 جمل)
4. ${level ? `مستوى الطالب: ${level}` : 'مناسب لجميع المستويات'}
5. استخدم المصطلحات التونسية المناسبة
6. ركز على المفاهيم الأساسية والتعريفات

## تنسيق الرد (JSON فقط - بدون نص إضافي):
{
  "flashcards": [
    {
      "question": "السؤال هنا؟",
      "answer": "الإجابة هنا"
    }
  ]
}

الموضوع: ${topic}`
    
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: 'أنت معلم تونسي خبير في إنشاء بطاقات المراجعة. ترد بتنسيق JSON فقط.' },
        { role: 'user', content: systemPrompt }
      ],
      temperature: 0.6,
      max_tokens: 2000
    })
    
    const responseText = completion.choices[0]?.message?.content || '{}'
    
    // Parse JSON from response
    let flashcards: Flashcard[] = []
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        flashcards = parsed.flashcards || []
      }
    } catch (parseError) {
      console.error('Failed to parse flashcards JSON:', parseError)
      return NextResponse.json({ 
        success: false, 
        error: 'لم أتمكن من إنشاء البطاقات بشكل صحيح. حاول مرة أخرى.' 
      })
    }
    
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
