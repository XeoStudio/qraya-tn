import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getZAI } from '@/lib/zai'

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
    const { topic } = body as { topic: string }
    
    if (!topic || topic.trim().length < 3) {
      return NextResponse.json({ 
        success: false, 
        error: 'الموضوع قصير جداً. أدخل موضوعاً أطول.' 
      })
    }
    
    const systemPrompt = `أنت معلم تونسي خبير في إنشاء بطاقات المراجعة للطلاب التونسيين.

## مهمتك:
إنشاء 8 بطاقات مراجعة حول الموضوع المحدد.

## قواعد البطاقات:
1. كل بطاقة تحتوي سؤال وإجابة
2. الأسئلة مختصرة وواضحة
3. الإجابات موجزة ومفيدة (1-3 جمل)
4. استخدم المصطلحات التونسية المناسبة
5. ركز على المفاهيم الأساسية والتعريفات

## تنسيق الرد (JSON فقط):
{
  "flashcards": [
    {
      "question": "السؤال هنا؟",
      "answer": "الإجابة هنا"
    }
  ]
}

الموضوع: ${topic}
أعد بتنسيق JSON فقط بدون أي نص إضافي.`
    
    let flashcards: Flashcard[] = []
    
    try {
      const zai = await getZAI()
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: 'أنت معلم تونسي خبير في إنشاء بطاقات المراجعة. ترد بتنسيق JSON فقط.' },
          { role: 'user', content: systemPrompt }
        ],
        temperature: 0.6,
        max_tokens: 2000
      })
      
      const responseText = completion.choices[0]?.message?.content || '{}'
      
      // Try to extract JSON from response
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const cleanJson = jsonMatch[0]
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim()
          const parsed = JSON.parse(cleanJson)
          flashcards = parsed.flashcards || []
        }
      } catch (parseError) {
        console.error('Parse error:', parseError)
      }
      
    } catch (aiError) {
      console.error('AI error:', aiError)
      return NextResponse.json({ 
        success: false, 
        error: 'حدث خطأ في معالجة الطلب. حاول مرة أخرى.' 
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
