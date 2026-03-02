import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getZAI } from '@/lib/zai'

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
    
    const userInfo: string[] = []
    if (level) userInfo.push(`المستوى الدراسي: ${level}`)
    if (goal) userInfo.push(`الهدف: ${goal}`)
    
    const systemPrompt = `أنت مستشار تعليمي تونسي خبير في تخطيط الدراسة للطلاب التونسيين.

## مهمتك:
إنشاء خطة دراسة أسبوعية مخصصة للطالب التونسي.

## معلومات الطالب:
- المواد الدراسية: ${subjects.join('، ')}
- عدد الأيام: ${days} يوم
- ساعات الدراسة اليومية: ${hoursPerDay} ساعة
${userInfo.length > 0 ? '- ' + userInfo.join('\n- ') : ''}

## قواعد الخطة:
1. وزع المواد بالتساوي على الأيام
2. أضف أوقات استراحة (كل ساعتين استراحة 15 دقيقة)
3. ركز على المواد الصعبة أكثر
4. أضف وقت للمراجعة في نهاية كل أسبوع
5. استخدم أيام الأسبوع التونسية: السبت، الأحد, الإثنين, الثلاثاء, الأربعاء, الخميس, الجمعة
6. كن واقعياً في التوقيت
7. أضف نصائح للدراسة الفعالة

## تنسيق الرد:
### 📌 جدول الدراسة

**اليوم 1 - [اسم اليوم]:**
- ⏰ 08:00 - 10:00: [المادة] - [الموضوع]
- ⏰ 10:15 - 12:15: [المادة] - [الموضوع]
...

### 💡 نصائح للدراسة
1. [نصيحة 1]
2. [نصيحة 2]
...

### 🎯 أهداف الأسبوع
- [هدف 1]
- [هدف 2]
...

أنشئ خطة دراسة مفصلة:`
    
    let studyPlan: string
    try {
      const zai = await getZAI()
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: 'أنت مستشار تعليمي تونسي خبير في تخطيط الدراسة للطلاب التونسيين.' },
          { role: 'user', content: systemPrompt }
        ],
        temperature: 0.7,
        max_tokens: 3000
      })
      
      studyPlan = completion.choices[0]?.message?.content || 'عذراً، لم أتمكن من إنشاء الخطة'
    } catch (aiError) {
      console.error('AI Study plan error:', aiError)
      return NextResponse.json({ 
        success: false, 
        error: 'حدث خطأ في معالجة الطلب. حاول مرة أخرى.' 
      })
    }
    
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
