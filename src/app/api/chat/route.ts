import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface WebResult {
  url: string
  name: string
  snippet: string
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const token = request.cookies.get('auth_token')?.value
    
    if (!token) {
      return NextResponse.json({ success: false, error: 'غير مصادق' }, { status: 401 })
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
    
    const user = session.user
    const subscription = user.subscription
    
    // Check quota (skip for admins and premium)
    const isPremium = user.role === 'ADMIN' || user.role === 'PREMIUM' || 
                      subscription?.plan === 'PREMIUM' || subscription?.plan === 'LIFETIME'
    
    if (!isPremium && subscription && !subscription.unlimitedChat && subscription.chatsUsed >= subscription.quotaLimit) {
      return NextResponse.json({ 
        success: false, 
        error: 'لقد استنفدت حد المحادثات اليومي. قم بالترقية للمتابعة' 
      }, { status: 403 })
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
      history: Message[]
      webResults?: WebResult[]
      enableWebSearch?: boolean
    }
    
    if (!message) {
      return NextResponse.json({ success: false, error: 'الرسالة مطلوبة' }, { status: 400 })
    }
    
    // Build system prompt
    const systemPrompt = buildSystemPrompt(user, context, webResults, enableWebSearch)
    
    // Prepare messages for AI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10).map((m: Message) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      })),
      { role: 'user', content: message }
    ]
    
    // Call AI
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages,
      temperature: 0.7,
      max_tokens: isPremium ? 3000 : 2000
    })
    
    const response = completion.choices[0]?.message?.content || 'عذراً، لم أتمكن من توليد رد. حاول مرة أخرى.'
    
    // Update usage
    if (subscription && !isPremium) {
      await db.subscription.update({
        where: { id: subscription.id },
        data: { chatsUsed: { increment: 1 } }
      })
    }
    
    // Update user points and last active
    await db.user.update({
      where: { id: user.id },
      data: { 
        points: { increment: 1 },
        lastActive: new Date()
      }
    })
    
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
  webResults?: WebResult[],
  enableWebSearch?: boolean
): string {
  const levelInfo = user.levelName ? `المستوى الدراسي: ${user.levelName}` : ''
  const yearInfo = user.year ? `السنة: ${user.year}` : ''
  const sectionInfo = user.section ? `الشعبة: ${user.section}` : ''
  const isAdmin = user.role === 'ADMIN'
  
  let webContext = ''
  if (enableWebSearch && webResults && webResults.length > 0) {
    webContext = `\n## نتائج البحث من الإنترنت:\n${webResults.map((r, i) => 
      `${i + 1}. ${r.name}\n   ${r.snippet}\n   المصدر: ${r.url}`
    ).join('\n')}\n\nاستخدم هذه المعلومات في إجابتك مع الإشارة للمصادر عند الحاجة.`
  }
  
  return `أنت "مساعد دراسة تونسي" - مساعد ذكي متخصص في مساعدة الطلاب التونسيين.

## هويتك:
- أنت معلم تونسي خبير ودود ومتعاون
- تتحدث العربية بطلاقة وتستخدم اللهجة التونسية أحياناً
- تجيب بالفرنسية للمواد العلمية عند الحاجة
- ${isAdmin ? 'المستخدم مدير النظام - تعامل معه باحترام خاص.' : ''}

## معلومات الطالب:
${user.name ? `الاسم: ${user.name}` : ''}
${levelInfo}
${yearInfo}
${sectionInfo}

## قواعد الرد:
1. كن ودوداً ومشجعاً دائماً 🌟
2. اشرح المفاهيم ببساطة ووضوح مع أمثلة
3. استخدم أمثلة من الواقع التونسي والمناهج التونسية
4. قدم خطوات منظمة عند الشرح (1. 2. 3. ...)
5. شجع الطالب على طرح الأسئلة
6. استخدم الإيموجي بشكل معتدل ومناسب
7. إذا كان السؤال خارج نطاق الدراسة، وجهه بلطف

## المناهج التونسية:
- التزم بالمناهج التونسية الرسمية
- استخدم المصطلحات المدرسية التونسية
- ارتبط بالامتحانات الوطنية عند الحاجة
- أهم المواد: رياضيات، علوم، فيزياء، فرنسية، إنجليزية، عربية، تاريخ، جغرافيا

## أساليب التدريس:
- للشرح: ابدأ بالتعريف، ثم الخصائص، ثم الأمثلة
- للتمارين: حل خطوة بخطوة مع التبرير
- للمراجعة: استخدم جداول تلخيصية ونقاط رئيسية
${webContext}
${context ? `\n## محتوى إضافي من الطالب:\n${context}` : ''}

## تنسيق الرد:
- استخدم العناوين والقوائم عند الحاجة
- أضف مسافات بين الفقرات
- رتب المعلومات بشكل منطقي

ابدأ المحادثة بشكل ودود وساعد الطالب في استفساراته بأسلوب معلم تونسي خبير!`
}
