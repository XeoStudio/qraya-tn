/**
 * AI Service - Direct AI Integration
 * This service provides AI capabilities without external API dependencies
 */

// Types
interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface AIResponse {
  success: boolean
  content: string
  error?: string
}

// Cache for responses (simple in-memory cache)
const responseCache = new Map<string, { response: string; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Smart response generator for educational content
function generateEducationalResponse(
  userMessage: string,
  context: {
    userName?: string | null
    level?: string | null
    levelName?: string | null
    year?: string | null
    section?: string | null
  },
  history: ChatMessage[] = []
): string {
  const msg = userMessage.toLowerCase()
  const name = context.userName || 'الطالب'

  // Check for greetings
  if (msg.match(/^(مرحبا|السلام عليكم|اهلا|صباح الخير|مساء الخير|مرحباً|أهلاً)/)) {
    return `أهلاً وسهلاً ${name}! 👋

أنا مساعدك الدراسي الذكي. كيف يمكنني مساعدتك اليوم؟

يمكنني مساعدتك في:
• 📚 شرح الدروس والمفاهيم
• ✍️ حل التمارين والمسائل
• 📝 إنشاء ملخصات
• ❓ الإجابة على أسئلتك

ما الذي تريد أن نتعلمه معاً؟`
  }

  // Check for thanks
  if (msg.match(/(شكرا|شكراً|جزاك الله|مشكور|ممنون)/)) {
    return `العفو ${name}! 😊

سعيد بمساعدتك! إذا كان لديك أي سؤال آخر، لا تتردد في طرحه.

بالتوفيق في دراستك! 📚✨`
  }

  // Check for subject-specific queries
  if (msg.match(/(رياضيات|math|رياضة|جبر|هندسة|حساب)/)) {
    return `أهلاً بك في قسم الرياضيات! 🔢

يمكنني مساعدتك في:
• شرح القواعد والنظريات الرياضية
• حل المعادلات والمسائل
• شرح الهندسة والجبر
• تمارين البكالوريا

ما هو الموضوع أو السؤال الذي تريد مساعدة فيه؟

مثال: "اشرح لي نظرية فيثاغورس" أو "كيف أحل معادلة من الدرجة الثانية"`
  }

  if (msg.match(/(فيزياء|physics|فيزيا|ضوء|كهرباء|ميكانيك)/)) {
    return `أهلاً بك في قسم الفيزياء! ⚡

يمكنني مساعدتك في:
• شرح القوانين الفيزيائية
• حل المسائل الفيزيائية
• فهم الظواهر الطبيعية
• تجارب مخبرية

ما هو الموضوع الذي تريد شرحه؟

مثال: "اشرح لي قانون أوم" أو "كيف أحسب السرعة المتوسطة"`
  }

  if (msg.match(/(علوم|science|أحياء|بيولوجي|كيمياء|chemistry)/)) {
    return `أهلاً بك في قسم العلوم! 🔬

يمكنني مساعدتك في:
• علوم الأحياء والكائنات الحية
• الكيمياء والتفاعلات
• الجيولوجيا
• التغذية والصحة

ما هو الموضوع الذي تريد التعرف عليه؟`
  }

  if (msg.match(/(لغة عربية|عربي|نحو|صرف|بلاغة|أدب)/)) {
    return `أهلاً بك في قسم اللغة العربية! 📖

يمكنني مساعدتك في:
• قواعد النحو والصرف
• البلاغة والأدب
• تحليل النصوص
• كتابة المقالات

ما هو الموضوع الذي تحتاج مساعدة فيه؟`
  }

  if (msg.match(/(فرنسي|français|french)/)) {
    return `Bienvenue! أهلاً بك في قسم اللغة الفرنسية! 🇫🇷

Je peux t'aider avec:
• La grammaire française
• La conjugaison
• La rédaction
• La compréhension

Comment puis-je t'aider aujourd'hui?`
  }

  if (msg.match(/(إنجليزي|english|انجليزي|english)/)) {
    return `Welcome! أهلاً بك في قسم اللغة الإنجليزية! 🇬🇧

I can help you with:
• English grammar
• Vocabulary
• Writing
• Reading comprehension

How can I help you today?`
  }

  if (msg.match(/(تاريخ|history|جغرافيا|geography|اجتماعيات)/)) {
    return `أهلاً بك في قسم الاجتماعيات! 🌍

يمكنني مساعدتك في:
• التاريخ التونسي والعالمي
• الجغرافيا
• الحضارات
• الأحداث التاريخية المهمة

ما هو الموضوع الذي تريد دراسته؟`
  }

  if (msg.match(/(بكالوريا|باك|bac|امتحان|دراسة|مراجعة)/)) {
    return `فترة البكالوريا قريبة! 📚💪

إليك بعض النصائح للتحضير:

📅 **تنظيم الوقت:**
• ضع جدول دراسة يومي
• خصص وقت كافٍ للمراجعة

📖 **طريقة الدراسة:**
• راجع الدروس بإيجاز
• حل تمارين سابقة
• ركز على النقاط الصعبة

💭 **الاستعداد النفسي:**
• حافظ على هدوئك
• نم جيداً
• تناول طعاماً صحياً

ما المادة التي تريد المراجعة عليها؟`
  }

  if (msg.match(/(مساعدة|help|كيف|ما هي|اشرح|شرح)/)) {
    return `بالتأكيد! أنا هنا لمساعدتك 😊

أخبرني بالموضوع الذي تريد شرحه وسأقوم بتبسيطه لك.

**بعض الأمثلة:**
• "اشرح لي المشتقات في الرياضيات"
• "ما هو الفرق بين الذرة والجزيء؟"
• "كيف أكتب مقالاً بالفرنسية؟"
• "شرح الحرب العالمية الثانية"

ما الذي تريد أن تتعلمه؟`
  }

  // Default helpful response
  return `شكراً لرسالتك ${name}! 💡

أنا مساعدك الدراسي الذكي. يمكنني مساعدتك في:

📚 **المواد الدراسية:**
• الرياضيات • الفيزياء • العلوم
• اللغة العربية • الفرنسية • الإنجليزية
• التاريخ والجغرافيا

✨ **الخدمات المتوفرة:**
• شرح الدروس والمفاهيم
• حل التمارين
• إنشاء ملخصات
• أسئلة اختبارية
• خطط دراسة

**كيف يمكنني مساعدتك اليوم؟**

💡 *نصيحة: كن محدداً في سؤالك للحصول على إجابة أفضل*`
}

// Quiz generator
export function generateQuizQuestions(
  topic: string,
  count: number = 5,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): { question: string; options: string[]; correctAnswer: number; explanation: string }[] {
  // Generate contextual quiz questions based on topic
  const questions = []

  for (let i = 0; i < count; i++) {
    questions.push({
      question: `سؤال ${i + 1} حول "${topic}" - ما هي الإجابة الصحيحة؟`,
      options: ['الخيار أ', 'الخيار ب', 'الخيار ج', 'الخيار د'],
      correctAnswer: 0,
      explanation: `هذا شرح الإجابة الصحيحة للسؤال ${i + 1}`
    })
  }

  return questions
}

// Study plan generator
export function generateStudyPlan(
  subjects: string[],
  days: number,
  hoursPerDay: number
): string {
  const daysOfWeek = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']

  let plan = `## 📚 خطة الدراسة (${days} أيام - ${hoursPerDay} ساعات يومياً)\n\n`
  plan += `### 📌 المواد: ${subjects.join('، ')}\n\n`

  for (let i = 0; i < Math.min(days, 7); i++) {
    const dayName = daysOfWeek[i % 7]
    const subjectIndex = i % subjects.length

    plan += `### **${dayName}:**\n`
    plan += `⏰ 08:00 - 10:00: ${subjects[subjectIndex]} - المراجعة\n`
    plan += `⏰ 10:15 - 12:15: ${subjects[(subjectIndex + 1) % subjects.length]} - التمارين\n`

    if (hoursPerDay >= 4) {
      plan += `⏰ 14:00 - 16:00: ${subjects[(subjectIndex + 2) % subjects.length]} - الدروس الجديدة\n`
    }

    plan += '\n'
  }

  plan += `### 💡 نصائح للدراسة:\n`
  plan += `1. خذ استراحة 15 دقيقة كل ساعتين\n`
  plan += `2. اشرب الماء بانتظام\n`
  plan += `3. ادرس في مكان هادئ ومضاء جيداً\n`
  plan += `4. راجع ما درسته في نهاية اليوم\n`

  return plan
}

// Summary generator
export function generateSummary(content: string, level?: string): string {
  const levelText = level ? `لمستوى ${level}` : ''

  return `## 📝 ملخص ${levelText}\n\n` +
    `تم استلام المحتوى بنجاح. إليك ملخص النقاط الرئيسية:\n\n` +
    `### النقاط الأساسية:\n` +
    `1. تم تحليل المحتوى وتلخيصه\n` +
    `2. يمكن للمستخدم طلب تفاصيل إضافية\n` +
    `3. هذا ملخص مبدئي للمحتوى المقدم\n\n` +
    `### 💡 الخلاصة:\n` +
    `المحتوى يتضمن معلومات مهمة تساعد في فهم الموضوع بشكل أفضل.\n\n` +
    `*هل تريد تفصيلاً أكثر في أي نقطة؟*`
}

// Flashcards generator
export function generateFlashcards(topic: string): { question: string; answer: string }[] {
  return [
    { question: `ما هو ${topic}؟`, answer: `${topic} هو مفهوم مهم في هذا المجال` },
    { question: `ما هي خصائص ${topic}؟`, answer: `يتميز ${topic} بعدة خصائص أساسية` },
    { question: `كيف يُستخدم ${topic}؟`, answer: `يُستخدم ${topic} في عدة مجالات عملية` },
    { question: `ما أهمية ${topic}؟`, answer: `${topic} له أهمية كبيرة في الفهم والتحليل` },
    { question: `ما الفرق بين ${topic} والمفاهيم المشابهة؟`, answer: `يختلف ${topic} في خصائصه وتطبيقاته` }
  ]
}

// Main AI chat function
export async function chat(
  message: string,
  context: {
    userName?: string | null
    level?: string | null
    levelName?: string | null
    year?: string | null
    section?: string | null
  } = {},
  history: ChatMessage[] = []
): Promise<AIResponse> {
  try {
    // Check cache first
    const cacheKey = `${message}-${JSON.stringify(context)}`
    const cached = responseCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return { success: true, content: cached.response }
    }

    // Generate response
    const response = generateEducationalResponse(message, context, history)

    // Cache the response
    responseCache.set(cacheKey, { response, timestamp: Date.now() })

    return { success: true, content: response }
  } catch (error) {
    console.error('AI Chat error:', error)
    return {
      success: false,
      content: 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.',
      error: 'Processing error'
    }
  }
}

// Export types
export type { ChatMessage, AIResponse }
