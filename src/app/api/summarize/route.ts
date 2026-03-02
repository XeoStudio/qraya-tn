import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

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
      return NextResponse.json({ success: false, error: 'الجلسة منتهية، يرجى تسجيل الدخول مجدداً' }, { status: 401 })
    }
    
    const body = await request.json()
    const { content, level } = body as { content: string; level?: string }
    
    if (!content || content.trim().length < 10) {
      return NextResponse.json({ 
        success: false, 
        error: 'المحتوى قصير جداً. أدخل نصاً أطول للتلخيص' 
      }, { status: 400 })
    }
    
    const levelText = level ? `مستوى الطالب: ${level}` : 'مستوى عام - استخدم لغة بسيطة ومفهومة'
    
    const systemPrompt = `أنت معلم تونسي خبير في تلخيص المحتوى التعليمي.

## مهمتك:
قم بتلخيص المحتوى المقدم بطريقة مناسبة للطالب التونسي.

## ${levelText}

## قواعد التلخيص:
1. استخرج النقاط الرئيسية فقط (لا تذكر التفاصيل غير المهمة)
2. استخدم لغة بسيطة وواضحة
3. نظم الملخص في نقاط مرقمة
4. أضف أمثلة توضيحية إذا لزم الأمر
5. استخدم المصطلحات التونسية المناسبة
6. أضف ملخص نهائي في جملة واحدة
7. إذا كان المحتوى طويلاً، قسمه إلى أقسام

## تنسيق الرد:
### 📌 الملخص:
- نقطة 1
- نقطة 2
- ...

### 💡 الخلاصة:
[جملة واحدة تلخص كل شيء]

قم بتلخيص المحتوى التالي:`
    
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content }
      ],
      temperature: 0.5,
      max_tokens: 1500
    })
    
    const summary = completion.choices[0]?.message?.content || 'عذراً، لم أتمكن من التلخيص'
    
    // Update points
    await db.user.update({
      where: { id: session.user.id },
      data: { points: { increment: 2 } }
    })
    
    // Log activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'summarize',
        details: `تلخيص محتوى (${content.length} حرف)`
      }
    })
    
    return NextResponse.json({ success: true, summary })
  } catch (error) {
    console.error('Summarize error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'حدث خطأ أثناء التلخيص. حاول مرة أخرى.' 
    }, { status: 500 })
  }
}
