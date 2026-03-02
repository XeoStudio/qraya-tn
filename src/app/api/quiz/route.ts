import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getZAI } from '@/lib/zai'

interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
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
    
    const difficultyText = {
      easy: 'سهل - للمبتدئين والمراجعة السريعة',
      medium: 'متوسط - للفهم العميق',
      hard: 'صعب - للامتحانات والتحدي'
    }[difficulty]
    
    const levelInfo = level ? `مستوى الطالب: ${level}` : 'مناسب لجميع المستويات'
    
    const systemPrompt = `أنت معلم تونسي خبير في إنشاء الأسئلة التدريبية للطلاب التونسيين.

## مهمتك:
إنشاء ${count} أسئلة اختيار متعدد (MCQ) حول الموضوع المحدد.

## قواعد الأسئلة:
1. كل سؤال له 4 خيارات فقط (أ، ب، ج، د)
2. إجابة واحدة صحيحة فقط
3. أضف شرح للإجابة الصحيحة
4. مستوى الصعوبة: ${difficultyText}
5. ${levelInfo}
6. استخدم المصطلحات والمناهج التونسية
7. الأسئلة يجب أن تكون دقيقة وواضحة

## تنسيق الرد (JSON فقط - بدون نص إضافي):
{
  "questions": [
    {
      "question": "نص السؤال هنا؟",
      "options": ["الخيار أ", "الخيار ب", "الخيار ج", "الخيار د"],
      "correctAnswer": 0,
      "explanation": "شرح الإجابة الصحيحة"
    }
  ]
}

ملاحظة: correctAnswer هو رقم الخيار الصحيح (0 للأول، 1 للثاني، إلخ)

الموضوع: ${topic}

أعد بتنسيق JSON فقط بدون أي نص إضافي.`
    
    let questions: QuizQuestion[] = []
    
    try {
      const zai = await getZAI()
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: 'أنت معلم تونسي خبير في إنشاء الأسئلة التدريبية. ترد بتنسيق JSON فقط.' },
          { role: 'user', content: systemPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2500
      })
      
      const responseText = completion.choices[0]?.message?.content || '{}'
      
      // Parse JSON from response
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const cleanJson = jsonMatch[0]
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim()
          const parsed = JSON.parse(cleanJson)
          questions = parsed.questions || []
        }
      } catch (parseError) {
        console.error('Parse error:', parseError)
        return NextResponse.json({ 
          success: false, 
          error: 'لم أتمكن من إنشاء الأسئلة بشكل صحيح. حاول مرة أخرى.' 
        })
      }
    } catch (aiError) {
      console.error('Quiz AI error:', aiError)
      return NextResponse.json({ 
        success: false, 
        error: 'حدث خطأ في معالجة الطلب. حاول مرة أخرى.' 
      })
    }
    
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
