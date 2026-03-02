/**
 * Real AI Service - Connected to ktai API
 * Full Tunisian educational context with real AI responses
 */

// API Configuration
const AI_CONFIG = {
  baseUrl: 'https://ktai.koyeb.app/v1',
  apiKey: 'sk-EtZogv60anr2rPKdFjtbAVVC56ix6Pupnu0V6KfD2JCZVvet',
  model: 'ktai-inc-provider1/gpt-5.2'
}

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

// ==================== TUNISIAN EDUCATIONAL CONTEXT ====================

function buildTunisianContext(user: UserProfile): string {
  const levelInfo = getLevelInfo(user.level)
  const govInfo = getGovernorateInfo(user.governorate)
  const specialization = getSpecialization(user.section)

  return `أنت "مساعد دراسة تونسي" - معلم ذكي متخصص في المناهج التونسية.

## هويتك:
أنت معلم تونسي خبير، ودود ومحترف. تتحدث العربية الفصحى بطلاقة وتستخدم الفرنسية للمصطلحات العلمية.

## الطالب الحالي:
- **الاسم:** ${user.name || 'طالب'}
- **المستوى الدراسي:** ${user.levelName || 'غير محدد'}${user.year ? ` - ${user.year}` : ''}
- **الشعبة:** ${user.section || 'غير محددة'} ${specialization ? `(${specialization})` : ''}
- **الولاية:** ${govInfo?.name || user.governorate || 'غير محددة'}${govInfo ? ` - ${govInfo.region}` : ''}
${user.subjects ? `- **المواد المفضلة:** ${user.subjects}` : ''}
- **نقاطه:** ${user.points} نقطة | **التسلسل:** ${user.streak} يوم

${levelInfo ? `## المواد المتاحة للمستوى ${user.levelName || 'الحالي'}:
${levelInfo.subjects.map(s => `• ${s}`).join('\n')}
` : ''}

## قواعد التدريس:

### 1. التخصيص:
- اشرح بطريقة مناسبة لمستوى الطالب
- استخدم أمثلة من الحياة اليومية التونسية
- اربط المفاهيم بالامتحانات الوطنية
- ركز على المواد المتعلقة بشعبة الطالب

### 2. أسلوب الشرح:
- ابدأ بالتعريف المبسط ثم التفاصيل
- استخدم الترقيم (1. 2. 3...)
- أضف أمثلة تطبيقية من المنهج التونسي
- اختم بملخص أو نقاط مهمة

### 3. اللغة:
- العربية الفصحى للشرح
- الفرنسية للمصطلحات العلمية والرياضيات
- التبسيط عند الحاجة

### 4. التفاعل:
- شجع الطالب على طرح الأسئلة
- قدم نصائح للمراجعة

## المناهج التونسية:
- التزم بالكتب المدرسية التونسية
- استخدم المصطلحات المعتمدة
- ارتبط بامتحانات البكالوريا والشهادة

${user.subscription?.plan && user.subscription.plan !== 'FREE' ? `
## مزايا الاشتراك (${user.subscription.plan}):
${user.subscription.agentMode ? '• شرح مفصل وعميق' : ''}
${user.subscription.advancedAI ? '• تحليل أعمق وإجابات أشمل' : ''}
` : ''}`
}

function getLevelInfo(level: string | null) {
  const levels: Record<string, { name: string; subjects: string[] }> = {
    primary: {
      name: 'التعليم الابتدائي',
      subjects: ['اللغة العربية', 'الرياضيات', 'العلوم', 'التربية الإسلامية', 'اللغة الفرنسية']
    },
    preparatory: {
      name: 'التعليم الإعدادي',
      subjects: ['اللغة العربية', 'الرياضيات', 'العلوم الفيزيائية', 'علوم الحياة والأرض', 'التاريخ', 'الجغرافيا', 'اللغة الفرنسية', 'اللغة الإنجليزية']
    },
    secondary: {
      name: 'التعليم الثانوي',
      subjects: ['اللغة العربية', 'الرياضيات', 'الفيزياء', 'الكيمياء', 'علوم الحياة والأرض', 'التاريخ', 'الجغرافيا', 'اللغة الفرنسية', 'اللغة الإنجليزية', 'الفلسفة', 'الاقتصاد']
    },
    bac: {
      name: 'مرحلة البكالوريا',
      subjects: ['الرياضيات', 'الفيزياء', 'الكيمياء', 'علوم الحياة والأرض', 'اللغة العربية', 'اللغة الفرنسية', 'اللغة الإنجليزية', 'التاريخ', 'الجغرافيا', 'الفلسفة', 'الاقتصاد', 'الإعلامية']
    }
  }
  return level ? levels[level] || null : null
}

function getGovernorateInfo(governorate: string | null) {
  const governorates: Record<string, { name: string; region: string }> = {
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
    monastir: { name: 'المنستير', region: 'الوسط الشرقي' },
    mahdia: { name: 'المهدية', region: 'الوسط الشرقي' },
    gafsa: { name: 'قفصة', region: 'الجنوب الغربي' },
    jendouba: { name: 'جندوبة', region: 'الشمال الغربي' },
    medenine: { name: 'مدنين', region: 'الجنوب الشرقي' }
  }
  return governorate ? governorates[governorate.toLowerCase()] || null : null
}

function getSpecialization(section: string | null): string {
  if (!section) return ''
  const s = section.toLowerCase()
  if (s.includes('علوم') || s.includes('science')) return 'شعبة علمية'
  if (s.includes('آداب') || s.includes('lettres')) return 'شعبة آداب'
  if (s.includes('اقتصاد')) return 'شعبة اقتصاد'
  if (s.includes('تقني')) return 'شعبة تقنية'
  if (s.includes('إعلامية') || s.includes('informatique')) return 'شعبة إعلامية'
  return ''
}

// ==================== AI API CALL ====================

async function callAI(
  systemPrompt: string,
  userMessage: string,
  options: { temperature?: number; maxTokens?: number; stream?: boolean } = {}
): Promise<string> {
  const { temperature = 0.7, maxTokens = 1500 } = options

  try {
    // Use AbortController for timeout (30 seconds for faster response)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    const response = await fetch(`${AI_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature,
        max_tokens: maxTokens,
        stream: false
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('AI API error:', response.status, errorText)
      throw new Error(`AI API error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || ''
  } catch (error) {
    console.error('AI call failed:', error)
    throw error
  }
}

// ==================== EXPORTED FUNCTIONS ====================

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
    const systemPrompt = buildTunisianContext(user)

    let fullMessage = message

    // Add conversation history
    if (options.history && options.history.length > 0) {
      const recentHistory = options.history.slice(-8)
      const historyContext = recentHistory
        .filter(m => m.role !== 'system')
        .map(m => `${m.role === 'user' ? 'الطالب' : 'المعلم'}: ${m.content}`)
        .join('\n')

      if (historyContext) {
        fullMessage = `[محادثة سابقة]\n${historyContext}\n\n[السؤال الحالي]\n${message}`
      }
    }

    const response = await callAI(systemPrompt, fullMessage, {
      temperature: options.thinking ? 0.5 : 0.7,
      maxTokens: options.thinking ? 3000 : 2000
    })

    return {
      success: true,
      content: response
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

export async function generateQuiz(
  topic: string,
  user: UserProfile,
  options: { count?: number; difficulty?: 'easy' | 'medium' | 'hard' } = {}
): Promise<{ success: boolean; questions?: { question: string; options: string[]; correctAnswer: number; explanation: string }[]; error?: string }> {
  const count = options.count || 5
  const difficulty = options.difficulty || 'medium'

  const systemPrompt = buildTunisianContext(user)

  const userPrompt = `أنشئ ${count} أسئلة اختيار متعدد حول: "${topic}"

المتطلبات:
- مستوى الصعوبة: ${difficulty === 'easy' ? 'سهل' : difficulty === 'hard' ? 'صعب' : 'متوسط'}
- كل سؤال له 4 خيارات فقط
- إجابة واحدة صحيحة
- أضف شرح للإجابة الصحيحة
- مناسب للمنهج التونسي

أعد الرد بتنسيق JSON فقط:
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
    const response = await callAI(systemPrompt, userPrompt, { temperature: 0.5, maxTokens: 3000 })

    // Extract JSON from response
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

export async function generateStudyPlan(
  subjects: string[],
  days: number,
  hoursPerDay: number,
  user: UserProfile,
  goal?: string
): Promise<{ success: boolean; plan?: string; error?: string }> {
  const systemPrompt = buildTunisianContext(user)

  const userPrompt = `أنشئ خطة دراسة مفصلة:

**المواد:** ${subjects.join('، ')}
**المدة:** ${days} يوم
**ساعات الدراسة اليومية:** ${hoursPerDay} ساعة
${goal ? `**الهدف:** ${goal}` : ''}

المتطلبات:
1. جدول أسبوعي مفصل
2. توزيع المواد بالتساوي
3. أوقات استراحة
4. تركيز على المواد الصعبة
5. وقت للمراجعة
6. نصائح دراسية
7. استخدم الأيام التونسية (السبت، الأحد، الإثنين...)`

  try {
    const plan = await callAI(systemPrompt, userPrompt, { temperature: 0.7, maxTokens: 3000 })
    return { success: true, plan }
  } catch (error) {
    console.error('Study plan error:', error)
    return { success: false, error: 'حدث خطأ في إنشاء الخطة' }
  }
}

export async function generateSummary(
  content: string,
  user: UserProfile
): Promise<{ success: boolean; summary?: string; error?: string }> {
  const systemPrompt = buildTunisianContext(user)

  const userPrompt = `لخص المحتوى التالي:

${content}

المتطلبات:
1. استخرج النقاط الرئيسية
2. لغة بسيطة وواضحة
3. نظم في نقاط مرقمة
4. أضف أمثلة عند الحاجة
5. اختم بجملة ملخصة`

  try {
    const summary = await callAI(systemPrompt, userPrompt, { temperature: 0.6, maxTokens: 2000 })
    return { success: true, summary }
  } catch (error) {
    console.error('Summary error:', error)
    return { success: false, error: 'حدث خطأ في التلخيص' }
  }
}

export async function generateFlashcards(
  topic: string,
  user: UserProfile,
  count: number = 8
): Promise<{ success: boolean; flashcards?: { question: string; answer: string }[]; error?: string }> {
  const systemPrompt = buildTunisianContext(user)

  const userPrompt = `أنشئ ${count} بطاقات مراجعة حول: "${topic}"

المتطلبات:
- أسئلة مختصرة وواضحة
- إجابات موجزة (1-3 جمل)
- مناسبة للمراجعة السريعة
- تغطي المفاهيم الأساسية

أعد الرد بتنسيق JSON:
{
  "flashcards": [
    { "question": "السؤال؟", "answer": "الإجابة" }
  ]
}`

  try {
    const response = await callAI(systemPrompt, userPrompt, { temperature: 0.6, maxTokens: 2000 })

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

export async function webSearch(
  query: string,
  user?: UserProfile,
  numResults: number = 5
): Promise<{ success: boolean; results?: SearchResult[]; error?: string }> {
  try {
    // Use AI to generate contextual search results
    const systemPrompt = `أنت محرك بحث تعليمي تونسي. ابحث عن معلومات حول الموضوع المطلوب وقدم نتائج مفيدة للطالب التونسي.`

    const userPrompt = `ابحث عن: "${query}"

قدم ${numResults} نتائج بحث بتنسيق JSON:
{
  "results": [
    {
      "url": "رابط المصدر",
      "name": "عنوان النتيجة",
      "snippet": "مقتطف من المحتوى",
      "source": "اسم المصدر"
    }
  ]
}`

    const response = await callAI(systemPrompt, userPrompt, { temperature: 0.3, maxTokens: 1500 })

    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return { success: true, results: parsed.results }
    }

    return { success: false, error: 'لم يتم العثور على نتائج' }
  } catch (error) {
    console.error('Web search error:', error)
    return { success: false, error: 'حدث خطأ في البحث' }
  }
}

export async function generateSupportResponse(
  ticketTitle: string,
  ticketMessage: string,
  category: string,
  user: UserProfile
): Promise<string> {
  const systemPrompt = `أنت مساعد دعم فني لموقع "مساعد دراسة تونسي".

قواعد الرد:
1. كن ودوداً ومحترفاً
2. أجب بالعربية الفصحى
3. قدم حلولاً عملية
4. للتواصل: واتساب +216 24 239 724

خطط الأسعار:
- مجاني: 10 محادثات، 3 OCR يومياً
- أساسي (9.99 DT/شهر): 50 محادثة، 20 OCR
- متقدم (19.99 DT/شهر): غير محدود
- باك برو (29.99 DT/شهر): للمتقدمين للباكالوريا`

  const userPrompt = `تذكرة دعم:
العنوان: ${ticketTitle}
التصنيف: ${category}
الرسالة: ${ticketMessage}

قدم رداً مناسباً.`

  try {
    return await callAI(systemPrompt, userPrompt, { temperature: 0.7, maxTokens: 500 })
  } catch {
    return 'شكراً لتواصلك معنا. سيتم الرد عليك قريباً.'
  }
}

// Export data for other uses
export const TUNISIAN_DATA = {
  levels: {
    primary: { name: 'التعليم الابتدائي', subjects: ['اللغة العربية', 'الرياضيات', 'العلوم', 'التربية الإسلامية', 'اللغة الفرنسية'] },
    preparatory: { name: 'التعليم الإعدادي', subjects: ['اللغة العربية', 'الرياضيات', 'العلوم الفيزيائية', 'علوم الحياة والأرض', 'التاريخ', 'الجغرافيا', 'اللغة الفرنسية', 'اللغة الإنجليزية'] },
    secondary: { name: 'التعليم الثانوي', subjects: ['اللغة العربية', 'الرياضيات', 'الفيزياء', 'الكيمياء', 'علوم الحياة والأرض', 'التاريخ', 'الجغرافيا', 'اللغة الفرنسية', 'اللغة الإنجليزية', 'الفلسفة', 'الاقتصاد'] },
    bac: { name: 'مرحلة البكالوريا', subjects: ['الرياضيات', 'الفيزياء', 'الكيمياء', 'علوم الحياة والأرض', 'اللغة العربية', 'اللغة الفرنسية', 'اللغة الإنجليزية', 'التاريخ', 'الجغرافيا', 'الفلسفة', 'الاقتصاد', 'الإعلامية'] }
  }
}
