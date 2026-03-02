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
    const { 
      message, 
      context, 
      history = [], 
      webResults = [],
      enableWebSearch = false 
    } = body as {
      message: string
      context?: string
      history: Array<{ role: string; content: string }>
      webResults?: Array<{ url: string; name: string; snippet: string }>
      enableWebSearch?: boolean
    }
    
    if (!message) {
      return NextResponse.json({ success: false, error: 'الرسالة مطلوبة' }, { status: 400 })
    }
    
    const user = session.user
    
    // Build system prompt
    const systemPrompt = buildSystemPrompt(user, context, webResults, enableWebSearch)
    
    // Prepare messages for AI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      })),
      { role: 'user', content: message }
    ]
    
    // Call AI with better error handling
    let response: string
    try {
      const zai = await ZAI.create()
      const completion = await zai.chat.completions.create({
        messages,
        temperature: 0.7,
        max_tokens: 2000
      })
      
      response = completion.choices[0]?.message?.content || 'عذراً، لم أتمكن من توليد رد. حاول مرة أخرى.'
    } catch (aiError) {
      console.error('AI Error:', aiError)
      return NextResponse.json({ 
        success: false, 
        error: 'حدث خطأ في الاتصال بالذكاء الاصطناعي. حاول مرة أخرى.' 
      }, { status: 500 })
    }
    
    // Update user points and last active
    try {
      await db.user.update({
        where: { id: user.id },
        data: { 
          points: { increment: 1 },
          lastActive: new Date()
        }
      })
    } catch {
      // Ignore update errors
    }
    
    return NextResponse.json({ 
      success: true, 
      response 
    })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'حدث خطأ في معالجة الرسالة' 
    }, { status: 500 })
  }
}

function buildSystemPrompt(
  user: { 
    name: string | null
    level: string | null
    levelName: string | null
    year: string | null
    section: string | null
    role: string
  }, 
  context?: string,
  webResults?: Array<{ url: string; name: string; snippet: string }>,
  enableWebSearch?: boolean
): string {
  const levelInfo = user.levelName ? `المستوى الدراسي: ${user.levelName}` : ''
  const yearInfo = user.year ? `السنة: ${user.year}` : ''
  const sectionInfo = user.section ? `الشعبة: ${user.section}` : ''
  
  let webContext = ''
  if (enableWebSearch && webResults && webResults.length > 0) {
    webContext = `\n## نتائج البحث من الإنترنت:\n${webResults.map((r, i) => 
      `${i + 1}. ${r.name}\n   ${r.snippet}\n   المصدر: ${r.url}`
    ).join('\n')}\n\nاستخدم هذه المعلومات في إجابتك مع الإشارة للمصادر عند الحاجة.`
  }
  
  return `أنت "مساعد دراسة تونسي" - مساعد ذكي متخصص في مساعدة الطلاب التونسيين.

## هويتك:
- أنت معلم تونسي خبير ودود ومتعاون
- تتحدث العربية بطلاقة
- تجيب بالفرنسية للمواد العلمية عند الحاجة

## معلومات الطالب:
${user.name ? `الاسم: ${user.name}` : ''}
${levelInfo}
${yearInfo}
${sectionInfo}

## قواعد الرد:
1. كن ودوداً ومشجعاً دائماً
2. اشرح المفاهيم ببساطة ووضوح مع أمثلة
3. استخدم أمثلة من الواقع التونسي والمناهج التونسية
4. قدم خطوات منظمة عند الشرح (1. 2. 3. ...)
5. شجع الطالب على طرح الأسئلة
6. إذا كان السؤال خارج نطاق الدراسة، وجهه بلطف

## المناهج التونسية:
- التزم بالمناهج التونسية الرسمية
- استخدم المصطلحات المدرسية التونسية
- ارتبط بالامتحانات الوطنية عند الحاجة
${webContext}
${context ? `\n## محتوى إضافي من الطالب:\n${context}` : ''}

ساعد الطالب في استفساراته بأسلوب معلم تونسي خبير!`
}
