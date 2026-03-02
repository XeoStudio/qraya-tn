/**
 * Real AI Service using Z-AI CLI
 * Provides intelligent, personalized AI responses for Tunisian students
 */

import { execSync } from 'child_process'
import { writeFileSync, readFileSync, unlinkSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

// Types
export interface UserProfile {
  id: string
  name: string | null
  email: string
  level: string | null        // primary, preparatory, secondary, bac
  levelName: string | null    // الاسم العربي للمستوى
  year: string | null         // السنة الدراسية
  section: string | null      // الشعبة (علوم، آداب، إلخ)
  governorate: string | null  // الولاية التونسية
  subjects: string | null     // المواد المفضلة
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

const TUNISIAN_GOVERNORATES: Record<string, { name: string; region: string; universities: string[] }> = {
  tunis: { name: 'تونس', region: 'تونس الكبرى', universities: ['جامعة تونس', 'جامعة تونس المنار', 'جامعة قرطاج'] },
  ariana: { name: 'أريانة', region: 'تونس الكبرى', universities: ['جامعة قرطاج'] },
  ben_arous: { name: 'بن عروس', region: 'تونس الكبرى', universities: ['جامعة قرطاج'] },
  manouba: { name: 'منوبة', region: 'تونس الكبرى', universities: ['جامعة منوبة'] },
  nabeul: { name: 'نابل', region: 'الشمال الشرقي', universities: ['جامعة قرطاج'] },
  sousse: { name: 'سوسة', region: 'الوسط الشرقي', universities: ['جامعة سوسة'] },
  sfax: { name: 'صفاقس', region: 'الجنوب الشرقي', universities: ['جامعة صفاقس'] },
  bizerte: { name: 'بنزرت', region: 'الشمال', universities: ['جامعة قرطاج'] },
  gabes: { name: 'قابس', region: 'الجنوب الشرقي', universities: ['جامعة قابس'] },
  ariana: { name: 'أريانة', region: 'تونس الكبرى', universities: [] },
  kairouan: { name: 'القيروان', region: 'الوسط', universities: ['جامعة القيروان'] },
  jendouba: { name: 'جندوبة', region: 'الشمال الغربي', universities: ['جامعة جندوبة'] },
  kef: { name: 'الكاف', region: 'الشمال الغربي', universities: ['جامعة جندوبة'] },
  kasserine: { name: 'القصرين', region: 'الوسط الغربي', universities: ['جامعة القيروان'] },
  gafsa: { name: 'قفصة', region: 'الجنوب الغربي', universities: ['جامعة قفصة'] },
  tozeur: { name: 'توزر', region: 'الجنوب الغربي', universities: [] },
  medenine: { name: 'مدنين', region: 'الجنوب الشرقي', universities: ['جامعة مدنين'] },
  tataouine: { name: 'تطاوين', region: 'الجنوب الشرقي', universities: [] },
  mahdia: { name: 'المهدية', region: 'الوسط الشرقي', universities: ['جامعة سوسة'] },
  monastir: { name: 'المنستير', region: 'الوسط الشرقي', universities: ['جامعة المنستير'] },
  sidi_bouzid: { name: 'سيدي بوزيد', region: 'الوسط', universities: [] },
  zaghouan: { name: 'زغوان', region: 'الشمال الشرقي', universities: [] },
  beja: { name: 'باجة', region: 'الشمال الغربي', universities: ['جامعة جندوبة'] },
  siliana: { name: 'سليانة', region: 'الشمال الغربي', universities: [] }
}

// Build personalized system prompt based on user profile
function buildSystemPrompt(user: UserProfile, context?: { webResults?: SearchResult[]; topic?: string }): string {
  // Get level info
  const levelInfo = user.level ? TUNISIAN_LEVELS[user.level] : null
  const governorateInfo = user.governorate ? TUNISIAN_GOVERNORATES[user.governorate.toLowerCase()] : null

  // Determine user's specialization based on section
  const specialization = getSpecialization(user.section)

  // Build the system prompt
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

  // Add premium features if user has subscription
  if (user.subscription?.plan && user.subscription.plan !== 'FREE') {
    systemPrompt += `
## مزايا الاشتراك (${user.subscription.plan}):
${user.subscription.agentMode ? '• **وضع المعلم:** شرح مفصل وعميق' : ''}
${user.subscription.advancedAI ? '• **ذكاء متقدم:** تحليل أعمق وإجابات أشمل' : ''}
`
  }

  // Add web search results if available
  if (context?.webResults && context.webResults.length > 0) {
    systemPrompt += `

## نتائج البحث من مصادر تونسية وعالمية:
${context.webResults.map((r, i) => `${i + 1}. **${r.name}**
   ${r.snippet}
   المصدر: ${r.url}`).join('\n\n')}

استخدم هذه المعلومات لدعم إجابتك مع الإشارة للمصادر عند الاقتباس.
`
  }

  // Add topic context if available
  if (context?.topic) {
    systemPrompt += `

## موضوع السؤال:
${context.topic}
`
  }

  return systemPrompt
}

// Get specialization based on section
function getSpecialization(section: string | null): string {
  if (!section) return ''

  const sectionLower = section.toLowerCase()

  if (sectionLower.includes('علوم') || sectionLower.includes('science')) {
    return 'شعبة علمية - ركز على الرياضيات والفيزياء والعلوم'
  }
  if (sectionLower.includes('آداب') || sectionLower.includes('lettres') || sectionLower.includes('اداب')) {
    return 'شعبة آداب - ركز على اللغات والتاريخ والفلسفة'
  }
  if (sectionLower.includes('اقتصاد') || sectionLower.includes('économie')) {
    return 'شعبة اقتصاد - ركز على الاقتصاد والرياضيات'
  }
  if (sectionLower.includes('تقني') || sectionLower.includes('technique')) {
    return 'شعبة تقنية - ركز على المواد التقنية والتكنولوجيا'
  }
  if (sectionLower.includes('إعلامية') || sectionLower.includes('informatique')) {
    return 'شعبة إعلامية - ركز على البرمجة والحاسوب'
  }
  if (sectionLower.includes('رياضة') || sectionLower.includes('sport')) {
    return 'شعبة رياضية'
  }

  return ''
}

// Execute z-ai CLI command
function executeAIChat(userPrompt: string, systemPrompt: string, thinking: boolean = false): string {
  const tmpFile = join(tmpdir(), `ai-response-${Date.now()}.json`)

  try {
    // Build command
    const escapedUserPrompt = userPrompt.replace(/"/g, '\\"').replace(/\n/g, ' ')
    const escapedSystemPrompt = systemPrompt.replace(/"/g, '\\"').replace(/\n/g, ' ')

    const thinkingFlag = thinking ? ' --thinking' : ''
    const command = `z-ai chat -p "${escapedUserPrompt}" -s "${escapedSystemPrompt}"${thinkingFlag} -o "${tmpFile}"`

    // Execute
    execSync(command, {
      timeout: 60000,
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    })

    // Read response
    if (existsSync(tmpFile)) {
      const response = JSON.parse(readFileSync(tmpFile, 'utf-8'))
      const content = response.choices?.[0]?.message?.content || ''

      // Cleanup
      try { unlinkSync(tmpFile) } catch {}

      return content
    }

    return ''
  } catch (error: unknown) {
    // Try to read partial response
    if (existsSync(tmpFile)) {
      try {
        const response = JSON.parse(readFileSync(tmpFile, 'utf-8'))
        const content = response.choices?.[0]?.message?.content || ''
        try { unlinkSync(tmpFile) } catch {}
        return content
      } catch {}
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('AI execution error:', errorMessage)
    throw new Error(`AI Error: ${errorMessage}`)
  }
}

// Execute web search using z-ai function
function executeWebSearch(query: string, numResults: number = 5): SearchResult[] {
  const tmpFile = join(tmpdir(), `search-${Date.now()}.json`)

  try {
    const escapedQuery = query.replace(/"/g, '\\"')
    const args = JSON.stringify({ query: escapedQuery, num: numResults }).replace(/"/g, '\\"')

    const command = `z-ai function -n web_search -a "${args}" -o "${tmpFile}"`

    execSync(command, {
      timeout: 30000,
      maxBuffer: 1024 * 1024 * 5
    })

    if (existsSync(tmpFile)) {
      const response = JSON.parse(readFileSync(tmpFile, 'utf-8'))
      try { unlinkSync(tmpFile) } catch {}

      if (Array.isArray(response)) {
        return response.map((item: { url?: string; name?: string; snippet?: string; host_name?: string }) => ({
          url: item.url || '',
          name: item.name || 'مصدر',
          snippet: item.snippet || '',
          source: item.host_name || new URL(item.url || '').hostname
        }))
      }
    }

    return []
  } catch (error) {
    console.error('Web search error:', error)
    try { if (existsSync(tmpFile)) unlinkSync(tmpFile) } catch {}
    return []
  }
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
    // Check if web search is needed
    let webResults: SearchResult[] = []

    if (options.enableWebSearch && shouldSearchWeb(message)) {
      const searchQuery = buildSearchQuery(message, user)
      webResults = executeWebSearch(searchQuery, 5)
    }

    // Build system prompt with user context
    const systemPrompt = buildSystemPrompt(user, { webResults })

    // Build user prompt with history context
    let fullPrompt = message

    if (options.history && options.history.length > 0) {
      const recentHistory = options.history.slice(-6) // Last 6 messages
      const historyContext = recentHistory
        .filter(m => m.role !== 'system')
        .map(m => `${m.role === 'user' ? 'الطالب' : 'المعلم'}: ${m.content}`)
        .join('\n')

      if (historyContext) {
        fullPrompt = `[محادثة سابقة]\n${historyContext}\n\n[السؤال الحالي]\n${message}`
      }
    }

    // Execute AI
    const response = executeAIChat(fullPrompt, systemPrompt, options.thinking)

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

// Quiz generation with real AI
export async function generateQuiz(
  topic: string,
  user: UserProfile,
  options: {
    count?: number
    difficulty?: 'easy' | 'medium' | 'hard'
  } = {}
): Promise<{ success: boolean; questions?: unknown[]; error?: string }> {
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
    const response = executeAIChat(userPrompt, systemPrompt, true)

    // Parse JSON from response
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
7. استخدم أيام الأسبوع التونسية (السبت للجمعة)

استخدم هذا التنسيق:
### 📅 اليوم الأول - [اسم اليوم]
⏰ 08:00 - 10:00: [المادة] - [الموضوع]
⏰ 10:15 - 12:15: [المادة] - [الموضوع]
...`

  try {
    const plan = executeAIChat(userPrompt, systemPrompt, true)
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
    const summary = executeAIChat(userPrompt, systemPrompt)
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
): Promise<{ success: boolean; flashcards?: unknown[]; error?: string }> {
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
    const response = executeAIChat(userPrompt, systemPrompt)

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

// Web search with Tunisian focus
export async function webSearch(
  query: string,
  user?: UserProfile,
  numResults: number = 5
): Promise<{ success: boolean; results?: SearchResult[]; error?: string }> {
  try {
    // Add Tunisian context to search
    const tunisianQuery = `${query} تونس تعليم`

    const results = executeWebSearch(tunisianQuery, numResults)

    return { success: true, results }
  } catch (error) {
    console.error('Web search error:', error)
    return { success: false, error: 'حدث خطأ في البحث' }
  }
}

// Support ticket AI response
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
    return executeAIChat(userPrompt, systemPrompt)
  } catch {
    return 'شكراً لتواصلك معنا. سيتم الرد عليك من قبل فريق الدعم في أقرب وقت.'
  }
}

// Helper: Determine if web search is needed
function shouldSearchWeb(message: string): boolean {
  const searchKeywords = [
    'بحث', 'ابحث', 'جوجل', 'مصدر', 'مرجع',
    'أخبار', 'جديد', 'حديث', '2024', '2025',
    'ما هو', 'ماهي', 'ماهو', 'تعريف',
    'معلومات عن', 'كل شيئ عن', 'كل شيء عن'
  ]

  return searchKeywords.some(keyword => message.includes(keyword))
}

// Helper: Build search query with context
function buildSearchQuery(message: string, user: UserProfile): string {
  let query = message

  // Add level context
  if (user.levelName) {
    query += ` ${user.levelName}`
  }

  // Add subject context if mentioned
  if (user.section) {
    query += ` ${user.section}`
  }

  // Add Tunisian context
  query += ' تونس تعليم'

  return query
}

// Export types and data
export { TUNISIAN_LEVELS, TUNISIAN_GOVERNORATES }
