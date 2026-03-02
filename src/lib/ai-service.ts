/**
 * Real AI Service - Works on both local and Vercel
 * Uses Z-AI SDK with environment variables or config file
 */

import ZAI from 'z-ai-web-dev-sdk'
import { writeFileSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

// Types
export interface UserProfile {
  id: string
  name: string | null
  email: string
  level: string | null
  levelName: string | null
  year: string | null
  section: string | null
  governorate: string | null
  subjects: string | null
  points: number
  streak: number
  role: string
  subscription?: {
    plan: string
    status: string
    agentMode: boolean
    advancedAI: boolean
  } | null
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIResponse {
  success: boolean
  content: string
  error?: string
  sources?: SearchResult[]
}

export interface SearchResult {
  url: string
  name: string
  snippet: string
  source: string
}

// Tunisian Educational System Data
const TUNISIAN_LEVELS: Record<string, { name: string; years: string[]; subjects: string[] }> = {
  primary: {
    name: 'التعليم الابتدائي',
    years: ['السنة الأولى', 'السنة الثانية', 'السنة الثالثة', 'السنة الرابعة', 'السنة الخامسة', 'السنة السادسة'],
    subjects: ['اللغة العربية', 'الرياضيات', 'العلوم', 'التربية الإسلامية', 'التربية المدنية', 'اللغة الفرنسية']
  },
  preparatory: {
    name: 'التعليم الإعدادي',
    years: ['السنة الأولى إعدادي', 'السنة الثانية إعدادي', 'السنة الثالثة إعدادي'],
    subjects: ['اللغة العربية', 'الرياضيات', 'العلوم الفيزيائية', 'علوم الحياة والأرض', 'التاريخ', 'الجغرافيا', 'اللغة الفرنسية', 'اللغة الإنجليزية', 'التربية الإسلامية', 'التربية المدنية']
  },
  secondary: {
    name: 'التعليم الثانوي',
    years: ['السنة الأولى ثانوي', 'السنة الثانية ثانوي', 'السنة الثالثة ثانوي', 'السنة الرابعة ثانوي'],
    subjects: ['اللغة العربية', 'الرياضيات', 'الفيزياء', 'الكيمياء', 'علوم الحياة والأرض', 'التاريخ', 'الجغرافيا', 'اللغة الفرنسية', 'اللغة الإنجليزية', 'الفلسفة', 'الاقتصاد', 'التربية الإسلامية']
  },
  bac: {
    name: 'مرحلة البكالوريا',
    years: ['باكالوريا 1', 'باكالوريا 2', 'باكالوريا 3', 'باكالوريا 4'],
    subjects: ['الرياضيات', 'الفيزياء', 'الكيمياء', 'علوم الحياة والأرض', 'اللغة العربية', 'اللغة الفرنسية', 'اللغة الإنجليزية', 'التاريخ', 'الجغرافيا', 'الفلسفة', 'الاقتصاد والتصرف', 'الإعلامية']
  }
}

const TUNISIAN_GOVERNORATES: Record<string, { name: string; region: string }> = {
  tunis: { name: 'تونس', region: 'تونس الكبرى' },
  ariana: { name: 'أريانة', region: 'تونس الكبرى' },
  ben_arous: { name: 'بن عروس', region: 'تونس الكبرى' },
  manouba: { name: 'منوبة', region: 'تونس الكبرى' },
  nabeul: { name: 'نابل', region: 'الشمال الشرقي' },
  sousse: { name: 'سوسة', region: 'الوسط الشرقي' },
  sfax: { name: 'صفاقس', region: 'الجنوب الشرقي' },
  bizerte: { name: 'بنزرت', region: 'الشمال' },
  gabes: { name: 'قابس', region: 'الجنوب الشرقي' },
  kairouan: { name: 'القيروان', region: 'الوسط' },
  jendouba: { name: 'جندوبة', region: 'الشمال الغربي' },
  kef: { name: 'الكاف', region: 'الشمال الغربي' },
  kasserine: { name: 'القصرين', region: 'الوسط الغربي' },
  gafsa: { name: 'قفصة', region: 'الجنوب الغربي' },
  tozeur: { name: 'توزر', region: 'الجنوب الغربي' },
  medenine: { name: 'مدنين', region: 'الجنوب الشرقي' },
  tataouine: { name: 'تطاوين', region: 'الجنوب الشرقي' },
  mahdia: { name: 'المهدية', region: 'الوسط الشرقي' },
  monastir: { name: 'المنستير', region: 'الوسط الشرقي' },
  sidi_bouzid: { name: 'سيدي بوزيد', region: 'الوسط' },
  zaghouan: { name: 'زغوان', region: 'الشمال الشرقي' },
  beja: { name: 'باجة', region: 'الشمال الغربي' },
  siliana: { name: 'سليانة', region: 'الشمال الغربي' }
}

// Z-AI Instance
let zaiInstance: ZAI | null = null

async function getZAI(): Promise<ZAI> {
  if (zaiInstance) return zaiInstance

  // Create config from environment variables if needed
  const baseUrl = process.env.ZAI_BASE_URL
  const apiKey = process.env.ZAI_API_KEY

  if (baseUrl && apiKey) {
    // Create temp config file for SDK
    try {
      const configPath = join(tmpdir(), '.z-ai-config')
      writeFileSync(configPath, JSON.stringify({
        baseUrl,
        apiKey,
        chatId: process.env.ZAI_CHAT_ID || '',
        userId: process.env.ZAI_USER_ID || ''
      }))
    } catch {}
  }

  zaiInstance = await ZAI.create()
  return zaiInstance
}

// Build personalized system prompt
function buildSystemPrompt(user: UserProfile, context?: { webResults?: SearchResult[]; topic?: string }): string {
  const levelInfo = user.level ? TUNISIAN_LEVELS[user.level] : null
  const governorateInfo = user.governorate ? TUNISIAN_GOVERNORATES[user.governorate.toLowerCase()] : null
  const specialization = getSpecialization(user.section)

  let systemPrompt = `أنت "مساعد دراسة تونسي" - معلم ذكي متخصص في المناهج التونسية.

## هويتك:
أنت معلم تونسي خبير، ودود ومحترف، تتحدث العربية الفصحى بطلاقة وتستطيع التبديل للفرنسية عند الحاجة للمواد العلمية.

## الطالب الحالي:
- **الاسم:** ${user.name || 'طالب'}
- **المستوى الدراسي:** ${user.levelName || 'غير محدد'}${user.year ? ` - ${user.year}` : ''}
- **الشعبة:** ${user.section || 'غير محددة'} ${specialization ? `(${specialization})` : ''}
- **الولاية:** ${governorateInfo?.name || user.governorate || 'غير محددة'}${governorateInfo ? ` - ${governorateInfo.region}` : ''}
${user.subjects ? `- **المواد المفضلة:** ${user.subjects}` : ''}
- **نقاطه:** ${user.points} نقطة | **التسلسل:** ${user.streak} يوم

## المواد الدراسية للمستوى ${user.levelName || 'الحالي'}:
${levelInfo?.subjects.map(s => `• ${s}`).join('\n') || '• جميع المواد الأساسية'}

## قواعد التدريس الأساسية:

### 1. التخصيص حسب المستوى:
- اشرح بطريقة مناسبة لمستوى الطالب
- استخدم أمثلة من الحياة اليومية التونسية
- اربط المفاهيم بالامتحانات الوطنية إن أمكن
- ركز على المواد المتعلقة بشعبة الطالب

### 2. أسلوب الشرح:
- ابدأ بالتعريف المبسط ثم التفاصيل
- استخدم الترقيم والتنظيم (1. 2. 3...)
- أضف أمثلة تطبيقية من المنهج التونسي
- اختم بملخص أو نقاط مهمة

### 3. التفاعل:
- شجع الطالب على طرح الأسئلة
- اسأل أسئلة تحققية لقياس الفهم
- قدم نصائح للمراجعة والحفظ

### 4. اللغة:
- العربية الفصحى للشرح
- الفرنسية للمصطلحات العلمية والرياضيات
- التبسيط عند الحاجة مع الحفاظ على الدقة

## المناهج التونسية:
- التزم بالكتب المدرسية التونسية الرسمية
- استخدم المصطلحات المعتمدة في تونس
- ارتبط بامتحانات البكالوريا والشهادة
- ذكر الأبواب والفصول من الكتب عند الحاجة
`

  if (user.subscription?.plan && user.subscription.plan !== 'FREE') {
    systemPrompt += `
## مزايا الاشتراك (${user.subscription.plan}):
${user.subscription.agentMode ? '• **وضع المعلم:** شرح مفصل وعميق' : ''}
${user.subscription.advancedAI ? '• **ذكاء متقدم:** تحليل أعمق وإجابات أشمل' : ''}
`
  }

  if (context?.webResults && context.webResults.length > 0) {
    systemPrompt += `

## نتائج البحث من مصادر تونسية وعالمية:
${context.webResults.map((r, i) => `${i + 1}. **${r.name}**
   ${r.snippet}
   المصدر: ${r.url}`).join('\n\n')}

استخدم هذه المعلومات لدعم إجابتك مع الإشارة للمصادر عند الاقتباس.
`
  }

  if (context?.topic) {
    systemPrompt += `

## موضوع السؤال:
${context.topic}
`
  }

  return systemPrompt
}

function getSpecialization(section: string | null): string {
  if (!section) return ''
  const s = section.toLowerCase()

  if (s.includes('علوم') || s.includes('science')) return 'شعبة علمية'
  if (s.includes('آداب') || s.includes('lettres')) return 'شعبة آداب'
  if (s.includes('اقتصاد') || s.includes('économie')) return 'شعبة اقتصاد'
  if (s.includes('تقني') || s.includes('technique')) return 'شعبة تقنية'
  if (s.includes('إعلامية') || s.includes('informatique')) return 'شعبة إعلامية'
  if (s.includes('رياضة') || s.includes('sport')) return 'شعبة رياضية'

  return ''
}

// Main chat function
export async function chat(
  message: string,
  user: UserProfile,
  options: {
    history?: ChatMessage[]
    enableWebSearch?: boolean
    thinking?: boolean
  } = {}
): Promise<AIResponse> {
  try {
    let webResults: SearchResult[] = []

    if (options.enableWebSearch && shouldSearchWeb(message)) {
      const searchQuery = buildSearchQuery(message, user)
      webResults = await executeWebSearch(searchQuery, 5)
    }

    const systemPrompt = buildSystemPrompt(user, { webResults })

    let fullPrompt = message
    if (options.history && options.history.length > 0) {
      const recentHistory = options.history.slice(-6)
      const historyContext = recentHistory
        .filter(m => m.role !== 'system')
        .map(m => `${m.role === 'user' ? 'الطالب' : 'المعلم'}: ${m.content}`)
        .join('\n')

      if (historyContext) {
        fullPrompt = `[محادثة سابقة]\n${historyContext}\n\n[السؤال الحالي]\n${message}`
      }
    }

    const zai = await getZAI()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: fullPrompt }
      ],
      thinking: options.thinking ? { type: 'enabled' } : { type: 'disabled' },
      temperature: 0.7,
      max_tokens: 2000
    })

    const response = completion.choices?.[0]?.message?.content || ''

    return {
      success: true,
      content: response,
      sources: webResults.length > 0 ? webResults : undefined
    }
  } catch (error: unknown) {
    console.error('Chat error:', error)
    return {
      success: false,
      content: '',
      error: error instanceof Error ? error.message : 'حدث خطأ في الاتصال بالذكاء الاصطناعي'
    }
  }
}

// Quiz generation
export async function generateQuiz(
  topic: string,
  user: UserProfile,
  options: { count?: number; difficulty?: 'easy' | 'medium' | 'hard' } = {}
): Promise<{ success: boolean; questions?: { question: string; options: string[]; correctAnswer: number; explanation: string }[]; error?: string }> {
  const count = options.count || 5
  const difficulty = options.difficulty || 'medium'

  const difficultyText = {
    easy: 'سهل - للمبتدئين والمراجعة السريعة',
    medium: 'متوسط - للفهم العميق',
    hard: 'صعب - مستوى الامتحانات الوطنية'
  }[difficulty]

  const systemPrompt = buildSystemPrompt(user, { topic })

  const userPrompt = `أنشئ ${count} أسئلة اختيار متعدد (MCQ) حول موضوع: "${topic}"

المتطلبات:
- مستوى الصعوبة: ${difficultyText}
- كل سؤال له 4 خيارات فقط
- إجابة واحدة صحيحة
- أضف شرح مختصر للإجابة الصحيحة
- الأسئلة مناسبة للمنهج التونسي

أعد الرد بتنسيق JSON فقط بدون أي نص إضافي:
{
  "questions": [
    {
      "question": "نص السؤال؟",
      "options": ["الخيار أ", "الخيار ب", "الخيار ج", "الخيار د"],
      "correctAnswer": 0,
      "explanation": "شرح الإجابة"
    }
  ]
}`

  try {
    const zai = await getZAI()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      thinking: { type: 'enabled' },
      temperature: 0.5,
      max_tokens: 2500
    })

    const response = completion.choices?.[0]?.message?.content || '{}'
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return { success: true, questions: parsed.questions }
    }

    return { success: false, error: 'لم أتمكن من تحليل الأسئلة' }
  } catch (error) {
    console.error('Quiz error:', error)
    return { success: false, error: 'حدث خطأ في إنشاء الأسئلة' }
  }
}

// Study plan generation
export async function generateStudyPlan(
  subjects: string[],
  days: number,
  hoursPerDay: number,
  user: UserProfile,
  goal?: string
): Promise<{ success: boolean; plan?: string; error?: string }> {
  const systemPrompt = buildSystemPrompt(user)

  const userPrompt = `أنشئ خطة دراسة مفصلة للطالب:

**المواد:** ${subjects.join('، ')}
**المدة:** ${days} يوم
**ساعات الدراسة اليومية:** ${hoursPerDay} ساعة
${goal ? `**الهدف:** ${goal}` : ''}

المتطلبات:
1. جدول أسبوعي مفصل بجميع الأيام
2. توزيع عادل للمواد
3. أوقات استراحة (كل ساعتين)
4. تركيز على المواد الصعبة
5. وقت للمراجعة
6. نصائح دراسية عملية
7. استخدم أيام الأسبوع التونسية (السبت للجمعة)`

  try {
    const zai = await getZAI()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      thinking: { type: 'enabled' },
      temperature: 0.7,
      max_tokens: 3000
    })

    const plan = completion.choices?.[0]?.message?.content || ''
    return { success: true, plan }
  } catch (error) {
    console.error('Study plan error:', error)
    return { success: false, error: 'حدث خطأ في إنشاء الخطة' }
  }
}

// Summary generation
export async function generateSummary(
  content: string,
  user: UserProfile
): Promise<{ success: boolean; summary?: string; error?: string }> {
  const systemPrompt = buildSystemPrompt(user)

  const userPrompt = `لخص المحتوى التالي بطريقة مناسبة للطالب التونسي:

**المحتوى:**
${content}

المتطلبات:
1. استخرج النقاط الرئيسية فقط
2. استخدم لغة بسيطة وواضحة
3. نظم في نقاط مرقمة
4. أضف أمثلة توضيحية عند الحاجة
5. اختم بجملة ملخصة

التنسيق:
### 📌 الملخص
- نقطة 1
- نقطة 2
...

### 💡 الخلاصة
[جملة واحدة تلخص كل شيء]`

  try {
    const zai = await getZAI()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })

    const summary = completion.choices?.[0]?.message?.content || ''
    return { success: true, summary }
  } catch (error) {
    console.error('Summary error:', error)
    return { success: false, error: 'حدث خطأ في التلخيص' }
  }
}

// Flashcards generation
export async function generateFlashcards(
  topic: string,
  user: UserProfile,
  count: number = 8
): Promise<{ success: boolean; flashcards?: { question: string; answer: string }[]; error?: string }> {
  const systemPrompt = buildSystemPrompt(user, { topic })

  const userPrompt = `أنشئ ${count} بطاقات مراجعة (Flashcards) حول موضوع: "${topic}"

المتطلبات:
- أسئلة مختصرة وواضحة
- إجابات موجزة (1-3 جمل)
- مناسبة للمراجعة السريعة
- تغطي المفاهيم الأساسية

أعد الرد بتنسيق JSON فقط:
{
  "flashcards": [
    {
      "question": "السؤال؟",
      "answer": "الإجابة"
    }
  ]
}`

  try {
    const zai = await getZAI()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.6,
      max_tokens: 2000
    })

    const response = completion.choices?.[0]?.message?.content || '{}'
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return { success: true, flashcards: parsed.flashcards }
    }

    return { success: false, error: 'لم أتمكن من تحليل البطاقات' }
  } catch (error) {
    console.error('Flashcards error:', error)
    return { success: false, error: 'حدث خطأ في إنشاء البطاقات' }
  }
}

// Web search
export async function webSearch(
  query: string,
  user?: UserProfile,
  numResults: number = 5
): Promise<{ success: boolean; results?: SearchResult[]; error?: string }> {
  try {
    const tunisianQuery = `${query} تونس تعليم`

    const zai = await getZAI()
    const searchResult = await zai.functions.invoke('web_search', {
      query: tunisianQuery,
      num: numResults
    })

    if (Array.isArray(searchResult)) {
      const results = searchResult.map((item: { url?: string; name?: string; snippet?: string; host_name?: string }) => ({
        url: item.url || '',
        name: item.name || 'مصدر',
        snippet: item.snippet || '',
        source: item.host_name || ''
      }))

      return { success: true, results }
    }

    return { success: false, error: 'لم يتم العثور على نتائج' }
  } catch (error) {
    console.error('Web search error:', error)
    return { success: false, error: 'حدث خطأ في البحث' }
  }
}

// Execute web search helper
async function executeWebSearch(query: string, num: number): Promise<SearchResult[]> {
  try {
    const zai = await getZAI()
    const searchResult = await zai.functions.invoke('web_search', { query, num })

    if (Array.isArray(searchResult)) {
      return searchResult.map((item: { url?: string; name?: string; snippet?: string; host_name?: string }) => ({
        url: item.url || '',
        name: item.name || 'مصدر',
        snippet: item.snippet || '',
        source: item.host_name || ''
      }))
    }

    return []
  } catch {
    return []
  }
}

// Support response
export async function generateSupportResponse(
  ticketTitle: string,
  ticketMessage: string,
  category: string,
  user: UserProfile
): Promise<string> {
  const systemPrompt = `أنت مساعد دعم فني لموقع "مساعد دراسة تونسي" - منصة تعليمية للطلاب التونسيين.

## قواعد الرد:
1. كن ودوداً ومحترفاً
2. أجب بالعربية الفصحى
3. قدم حلولاً عملية وواضحة
4. إذا لم تتمكن من حل المشكلة، اقترح التواصل مع فريق الدعم

## خطط الأسعار:
- مجاني: 10 محادثات، 3 OCR يومياً
- أساسي (9.99 DT/شهر): 50 محادثة، 20 OCR، وضع المعلم
- متقدم (19.99 DT/شهر): غير محدود + ميزات متقدمة
- باك برو (29.99 DT/شهر لـ 4 أشهر): للمتقدمين للباكالوريا

## التواصل:
- واتساب: +216 24 239 724
- البريد: support@qraya.tn`

  const userPrompt = `تذكرة دعم فني:

**العنوان:** ${ticketTitle}
**التصنيف:** ${category}
**الرسالة:** ${ticketMessage}

قدم رداً مناسباً ومفيداً.`

  try {
    const zai = await getZAI()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    })

    return completion.choices?.[0]?.message?.content || 'شكراً لتواصلك معنا. سيتم الرد عليك قريباً.'
  } catch {
    return 'شكراً لتواصلك معنا. سيتم الرد عليك من قبل فريق الدعم في أقرب وقت.'
  }
}

// Helpers
function shouldSearchWeb(message: string): boolean {
  const keywords = ['بحث', 'ابحث', 'جوجل', 'مصدر', 'مرجع', 'أخبار', 'جديد', 'حديث', '2024', '2025']
  return keywords.some(k => message.includes(k))
}

function buildSearchQuery(message: string, user: UserProfile): string {
  let query = message
  if (user.levelName) query += ` ${user.levelName}`
  if (user.section) query += ` ${user.section}`
  query += ' تونس تعليم'
  return query
}

export { TUNISIAN_LEVELS, TUNISIAN_GOVERNORATES }
