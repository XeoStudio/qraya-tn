/**
 * Universal AI Service - Works everywhere without external dependencies
 * Uses built-in intelligent response system with Tunisian educational knowledge
 */

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

// ==================== TUNISIAN EDUCATIONAL DATABASE ====================

const TUNISIAN_DATA = {
  levels: {
    primary: {
      name: 'التعليم الابتدائي',
      years: ['السنة الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة'],
      subjects: {
        'اللغة العربية': ['قراءة', 'إملاء', 'قواعد', 'تعبير', 'محفوظات'],
        'الرياضيات': ['الأعداد', 'الجمع والطرح', 'الضرب والقسمة', 'الأشكال الهندسية', 'القياس'],
        'العلوم': ['الكائنات الحية', 'المادة', 'الطاقة', 'الأرض والكون'],
        'اللغة الفرنسية': ['lecture', 'écriture', 'grammaire', 'vocabulaire'],
        'التربية الإسلامية': ['العبادات', 'الأخلاق', 'السيرة النبوية'],
        'التربية المدنية': ['الوطن', 'الحقوق والواجبات', 'المؤسسات']
      }
    },
    preparatory: {
      name: 'التعليم الإعدادي',
      years: ['الأولى إعدادي', 'الثانية إعدادي', 'الثالثة إعدادي'],
      subjects: {
        'اللغة العربية': ['النحو', 'الصرف', 'البلاغة', 'الأدب', 'المطالعة', 'التعبير'],
        'الرياضيات': ['الجبر', 'الهندسة', 'الإحصاء', 'الدوال', 'المعادلات'],
        'العلوم الفيزيائية': ['المادة', 'الكهرباء', 'الطاقة', 'الضوء', 'الحركة'],
        'علوم الحياة والأرض': ['الخلية', 'الوراثة', 'الجهاز العصبي', 'البيئة'],
        'التاريخ': ['الحضارات القديمة', 'العصور الوسطى', 'التاريخ المعاصر', 'تاريخ تونس'],
        'الجغرافيا': ['الجغرافيا الطبيعية', 'السكان', 'الاقتصاد', 'تونس والعالم'],
        'اللغة الفرنسية': ['grammaire', 'conjugaison', 'vocabulaire', 'expression écrite', 'compréhension'],
        'اللغة الإنجليزية': ['grammar', 'vocabulary', 'reading', 'writing', 'listening']
      }
    },
    secondary: {
      name: 'التعليم الثانوي',
      years: ['الأولى ثانوي', 'الثانية ثانوي', 'الثالثة ثانوي', 'الرابعة ثانوي'],
      subjects: {
        'الرياضيات': ['التحليل', 'الجبر الخطي', 'الهندسة الفضائية', 'الاحتمالات', 'الدوال'],
        'الفيزياء': ['الميكانيكا', 'الكهرباء', 'البصريات', 'الحرارة', 'الذرة'],
        'الكيمياء': ['التفاعلات الكيميائية', 'الحركية', 'الاتزان', 'الكيمياء العضوية'],
        'علوم الحياة والأرض': ['الوراثة', 'الجيولوجيا', 'علم الأحياء', 'التطور'],
        'اللغة العربية': ['الأدب العربي', 'النحو المتقدم', 'البلاغة', 'النقد الأدبي'],
        'التاريخ': ['تاريخ العالم', 'تاريخ العرب', 'تاريخ تونس الحديث', 'العلاقات الدولية'],
        'الفلسفة': ['المنطق', 'الأخلاق', 'المعرفة', 'الوجود'],
        'الاقتصاد': ['الميكرواقتصاد', 'الماكرواقتصاد', 'الاقتصاد التونسي']
      }
    },
    bac: {
      name: 'مرحلة البكالوريا',
      years: ['باكالوريا 1', 'باكالوريا 2', 'باكالوريا 3', 'باكالوريا 4'],
      sections: {
        'علوم تجريبية': { subjects: ['الرياضيات', 'الفيزياء', 'علوم الحياة والأرض', 'الكيمياء'], focus: 'Scientific' },
        'رياضيات': { subjects: ['الرياضيات', 'الفيزياء', 'العلوم الفيزيائية'], focus: 'Mathematical' },
        'تقنية': { subjects: ['الرياضيات', 'الفيزياء', 'التقنية', 'الإعلامية'], focus: 'Technical' },
        'آداب': { subjects: ['اللغة العربية', 'التاريخ', 'الجغرافيا', 'الفلسفة', 'اللغات'], focus: 'Literary' },
        'اقتصاد وتصرف': { subjects: ['الاقتصاد', 'الرياضيات', 'التسيير', 'القانون'], focus: 'Economic' },
        'إعلامية': { subjects: ['الخوارزميات', 'البرمجة', 'قواعد البيانات', 'الشبكات'], focus: 'IT' }
      }
    }
  },

  governorates: {
    tunis: { name: 'تونس', region: 'تونس الكبرى', universities: ['جامعة تونس', 'جامعة تونس المنار', 'جامعة قرطاج'] },
    ariana: { name: 'أريانة', region: 'تونس الكبرى', universities: ['جامعة قرطاج'] },
    ben_arous: { name: 'بن عروس', region: 'تونس الكبرى', universities: ['جامعة قرطاج'] },
    manouba: { name: 'منوبة', region: 'تونس الكبرى', universities: ['جامعة منوبة'] },
    nabeul: { name: 'نابل', region: 'الشمال الشرقي', universities: ['جامعة قرطاج'] },
    sousse: { name: 'سوسة', region: 'الوسط الشرقي', universities: ['جامعة سوسة'] },
    sfax: { name: 'صفاقس', region: 'الجنوب الشرقي', universities: ['جامعة صفاقس'] },
    bizerte: { name: 'بنزرت', region: 'الشمال', universities: ['جامعة قرطاج'] },
    gabes: { name: 'قابس', region: 'الجنوب الشرقي', universities: ['جامعة قابس'] },
    kairouan: { name: 'القيروان', region: 'الوسط', universities: ['جامعة القيروان'] },
    monastir: { name: 'المنستير', region: 'الوسط الشرقي', universities: ['جامعة المنستير'] },
    mahdia: { name: 'المهدية', region: 'الوسط الشرقي', universities: ['جامعة سوسة'] },
    gafsa: { name: 'قفصة', region: 'الجنوب الغربي', universities: ['جامعة قفصة'] },
    jendouba: { name: 'جندوبة', region: 'الشمال الغربي', universities: ['جامعة جندوبة'] },
    beja: { name: 'باجة', region: 'الشمال الغربي', universities: ['جامعة جندوبة'] },
    kef: { name: 'الكاف', region: 'الشمال الغربي', universities: ['جامعة جندوبة'] },
    kasserine: { name: 'القصرين', region: 'الوسط الغربي', universities: [] },
    sidi_bouzid: { name: 'سيدي بوزيد', region: 'الوسط', universities: [] },
    tozeur: { name: 'توزر', region: 'الجنوب الغربي', universities: [] },
    medenine: { name: 'مدنين', region: 'الجنوب الشرقي', universities: ['جامعة مدنين'] },
    tataouine: { name: 'تطاوين', region: 'الجنوب الشرقي', universities: [] },
    zaghouan: { name: 'زغوان', region: 'الشمال الشرقي', universities: [] },
    siliana: { name: 'سليانة', region: 'الشمال الغربي', universities: [] }
  },

  // Educational topics database
  topics: {
    // Mathematics
    'المعادلات': {
      definition: 'المعادلة هي عبارة رياضية تحتوي على مجهول واحد أو أكثر، ويساوي بين تعبيرين رياضيين.',
      formula: 'مثال: ax + b = 0، حيث a ≠ 0',
      steps: ['ننقل الحدود المتشابهة', 'نجمع الحدود المتشابهة', 'نقسم على معامل المجهول'],
      examples: ['2x + 5 = 15 → 2x = 10 → x = 5', '3x - 7 = 2x + 3 → x = 10']
    },
    'الدوال': {
      definition: 'الدالة هي علاقة تربط كل عنصر من مجموعة المنطلق بعنصر وحيد من مجموعة المستقر.',
      types: ['دالة خطية: f(x) = ax + b', 'دالة تربيعية: f(x) = ax² + bx + c', 'دالة كسرية', 'دالة جذرية'],
      properties: ['مجال التعريف', 'مجال القيم', 'النقاط الثابتة', 'التغير', 'التناظر']
    },
    'الهندسة': {
      definition: 'الهندسة فرع من فروع الرياضيات يدرس الأشكال والفضاء والعلاقات المكانية.',
      types: ['الهندسة المستوية', 'الهندسة الفضائية', 'الهندسة التحليلية'],
      theorems: ['نظرية فيثاغورس', 'نظرية طالس', 'نظرية الإسقاط', 'الدوائر المثلثية']
    },
    'التفاضل والتكامل': {
      definition: 'دراسة معدلات التغير والمساحات والتجمعات.',
      concepts: ['المشتقة', 'التكامل', 'نهايات الدوال', 'الاستمرارية'],
      applications: ['إيجاد القيم القصوى', 'حساب المساحات', 'دراسة تغير الدوال']
    },

    // Physics
    'الكهرباء': {
      definition: 'دراسة الشحنات الكهربائية والتيار الكهربائي والدوائر الكهربائية.',
      laws: ['قانون أوم: V = IR', 'قانون كيرشوف', 'قانون جول', 'قانون فاراداي'],
      concepts: ['التيار الكهربائي', 'الجهد الكهربائي', 'المقاومة', 'القدرة الكهربائية', 'الطاقة الكهربائية']
    },
    'الميكانيكا': {
      definition: 'دراسة الحركة والقوى المؤثرة على الأجسام.',
      laws: ['قوانين نيوتن', 'قانون حفظ الطاقة', 'قانون حفظ كمية الحركة', 'قانون الجاذبية'],
      concepts: ['السرعة', 'التسارع', 'القوة', 'الشغل', 'الطاقة الحركية والكامنة']
    },
    'البصريات': {
      definition: 'دراسة الضوء وانتشاره وانعكاسه وانكساره.',
      laws: ['قانون الانعكاس', 'قانون الانكسار (سنيل)', 'قانون العدسات'],
      concepts: ['الانعكاس', 'الانكسار', 'العدسات', 'المرايا', 'التداخل', 'الحيود']
    },

    // Chemistry
    'التفاعلات الكيميائية': {
      definition: 'تحول المواد المتفاعلة إلى مواد ناتجة من خلال تكسير وإنشاء روابط كيميائية.',
      types: ['تفاعل أكسدة واختزال', 'تفاعل تعادل', 'تفاعل تفكك', 'تفاعل ترسيب'],
      balancing: 'موازنة المعادلة بضمان حفظ عدد الذرات وكتلتها وشحنتها.'
    },
    'الكيمياء العضوية': {
      definition: 'دراسة مركبات الكربون والهيدروجين ومشتقاتها.',
      families: ['الألكانات', 'الألكينات', 'الألكاينات', 'الكحولات', 'الأحماض الكربوكسيلية', 'الإستر'],
      reactions: ['هدرجة', 'أكسدة', 'اختزال', 'استبدال', 'إضافة']
    },

    // Biology
    'الوراثة': {
      definition: 'علم دراسة انتقال الصفات الوراثية من الآباء إلى الأبناء.',
      concepts: ['الجينات', 'الكروموسومات', 'DNA', 'RNA', 'الطفرات', 'الوراثة المندلية'],
      laws: ['قوانين مندل', 'قانون الانعزال', 'قانون التوزيع الحر']
    },
    'الخلية': {
      definition: 'الوحدة الأساسية للحياة، أصغر وحدة حية قادرة على أداء جميع وظائف الحياة.',
      types: ['خلية حيوانية', 'خلية نباتية', 'خلية بدائية النواة', 'خلية حقيقية النواة'],
      organelles: ['النواة', 'الميتوكوندريا', 'الريبوزومات', 'جهاز جولجي', 'الشبكة الإندوبلازمية']
    },

    // History
    'تاريخ تونس': {
      periods: ['العصر القديم: قرطاج وروما', 'العصر الإسلامي', 'العهد العثماني', 'الاستعمار الفرنسي', 'الاستقلال 1956', 'الثورة 2011'],
      key_events: ['تأسيس قرطاج 814 ق.م', 'فتح تونس 647 م', 'معركة بونة 1535', 'معاهدات الحماية 1881', 'استقلال تونس 20 مارس 1956']
    },
    'الحضارات': {
      types: ['الحضارة المصرية', 'الحضارة الرافدين', 'الحضارة اليونانية', 'الحضارة الرومانية', 'الحضارة الإسلامية'],
      contributions: ['الكتابة', 'العمارة', 'العلوم', 'الفلسفة', 'الفنون']
    },

    // Languages
    'النحو': {
      definition: 'علم يدرس أواخر الكلمات إعراباً وبناءً.',
      topics: ['المبتدأ والخبر', 'الفاعل ونائب الفاعل', 'المفعول به', 'الحال', 'التمييز', 'النعت', 'العطف'],
      cases: ['الرفع', 'النصب', 'الجر', 'الجزم']
    },
    'البلاغة': {
      branches: ['علم البيان: التشبيه، الاستعارة، الكناية', 'علم المعاني', 'علم البديع'],
      figures: ['التشبيه', 'الاستعارة', 'الكناية', 'المجاز', 'التقديم والتأخير']
    },

    // Philosophy
    'الفلسفة': {
      branches: ['الميتافيزيقا', 'المعرفة (الابستمولوجيا)', 'الأخلاق', 'المنطق', 'الجماليات'],
      questions: ['ما هو الوجود؟', 'ما هي المعرفة؟', 'ما هو الخير؟', 'ما هو الجمال؟'],
      schools: ['المثالية', 'الواقعية', 'الوجودية', 'البراغماتية']
    },

    // Economics
    'الاقتصاد': {
      branches: ['الاقتصاد الجزئي', 'الاقتصاد الكلي', 'الاقتصاد الدولي', 'الاقتصاد التنموي'],
      concepts: ['العرض والطلب', 'السوق', 'التضخم', 'البطالة', 'النمو الاقتصادي', 'التجارة الدولية']
    }
  },

  // Exam information
  exams: {
    bac: {
      subjects: {
        'الرياضيات': { duration: '4 ساعات', coefficient: 4, type: 'امتحان كتابي' },
        'الفيزياء': { duration: '3 ساعات', coefficient: 3, type: 'امتحان كتابي + تجريبي' },
        'اللغة العربية': { duration: '3 ساعات', coefficient: 2, type: 'امتحان كتابي' },
        'الفرنسية': { duration: '3 ساعات', coefficient: 2, type: 'امتحان كتابي' },
        'الإنجليزية': { duration: '2 ساعات', coefficient: 1, type: 'امتحان كتابي' },
        'الفلسفة': { duration: '3 ساعات', coefficient: 2, type: 'امتحان كتابي' }
      },
      tips: ['راجع الدروس بانتظام', 'حل تمارين السنوات السابقة', 'نم جيداً ليلة الامتحان', 'اقرأ السؤال جيداً قبل الإجابة']
    }
  }
}

// ==================== AI RESPONSE GENERATOR ====================

class TunisianAI {
  private user: UserProfile
  private context: string[] = []

  constructor(user: UserProfile) {
    this.user = user
  }

  // Build context-aware system message
  private buildSystemContext(): string {
    const levelInfo = this.user.level ? TUNISIAN_DATA.levels[this.user.level as keyof typeof TUNISIAN_DATA.levels] : null
    const govInfo = this.user.governorate ? TUNISIAN_DATA.governorates[this.user.governorate.toLowerCase() as keyof typeof TUNISIAN_DATA.governorates] : null

    let context = `أنت مساعد دراسة تونسي ذكي.

معلومات الطالب:
- الاسم: ${this.user.name || 'طالب'}
- المستوى: ${this.user.levelName || 'غير محدد'}${this.user.year ? ` - ${this.user.year}` : ''}
- الشعبة: ${this.user.section || 'غير محددة'}
- الولاية: ${govInfo?.name || this.user.governorate || 'غير محددة'}
- النقاط: ${this.user.points} | التسلسل: ${this.user.streak} يوم
`

    if (levelInfo) {
      context += `\nالمواد المتاحة للمستوى: ${Object.keys(levelInfo.subjects).join('، ')}`
    }

    return context
  }

  // Analyze user message and extract intent
  private analyzeIntent(message: string): {
    type: 'question' | 'explanation' | 'example' | 'exercise' | 'summary' | 'greeting' | 'unknown'
    subject: string | null
    topic: string | null
    keywords: string[]
  } {
    const msg = message.toLowerCase()
    const keywords: string[] = []

    // Detect subject
    const subjects = ['رياضيات', 'فيزياء', 'كيمياء', 'علوم', 'أحياء', 'عربي', 'فرنسي', 'إنجليزي', 'تاريخ', 'جغرافيا', 'فلسفة', 'اقتصاد', 'إسلامية']
    let subject: string | null = null
    for (const s of subjects) {
      if (msg.includes(s)) {
        subject = s
        keywords.push(s)
      }
    }

    // Detect topic
    const topics = Object.keys(TUNISIAN_DATA.topics)
    let topic: string | null = null
    for (const t of topics) {
      if (msg.includes(t)) {
        topic = t
        keywords.push(t)
      }
    }

    // Detect intent
    let type: 'question' | 'explanation' | 'example' | 'exercise' | 'summary' | 'greeting' | 'unknown' = 'unknown'

    if (msg.match(/^(مرحبا|السلام|اهلا|صباح|مساء)/)) {
      type = 'greeting'
    } else if (msg.match(/(ما هو|ما هي|عرف|تعريف|شرح|اشرح|ماهو)/)) {
      type = 'explanation'
    } else if (msg.match(/(مثال|أمثلة|تطبيق)/)) {
      type = 'example'
    } else if (msg.match(/(تمرين|مسألة|سؤال|اختبار|امتحان)/)) {
      type = 'exercise'
    } else if (msg.match(/(لخص|ملخص|خلاصة|أهم النقاط)/)) {
      type = 'summary'
    } else if (msg.includes('؟') || msg.includes('?')) {
      type = 'question'
    }

    return { type, subject, topic, keywords }
  }

  // Generate intelligent response
  generateResponse(message: string, history: ChatMessage[] = []): string {
    const intent = this.analyzeIntent(message)
    const systemContext = this.buildSystemContext()

    // Handle greeting
    if (intent.type === 'greeting') {
      return this.generateGreeting()
    }

    // Handle known topics
    if (intent.topic && TUNISIAN_DATA.topics[intent.topic as keyof typeof TUNISIAN_DATA.topics]) {
      return this.generateTopicResponse(intent.topic, intent.type)
    }

    // Handle subject-specific questions
    if (intent.subject) {
      return this.generateSubjectResponse(intent.subject, message, intent.type)
    }

    // Handle general educational questions
    return this.generateGeneralResponse(message, intent)
  }

  private generateGreeting(): string {
    const greetings = [
      `أهلاً وسهلاً ${this.user.name || 'بك'}! 👋
أنا مساعدك الدراسي الذكي. سعيد بمساعدتك اليوم!

📚 يمكنني مساعدتك في:
• شرح الدروس والمفاهيم
• حل التمارين والمسائل
• إنشاء ملخصات
• الإجابة على أسئلتك

ما الذي تريد أن تتعلمه اليوم؟`,

      `مرحباً ${this.user.name || 'صديقي'}! 🌟
أنت في المكان الصحيح للحصول على مساعدة دراسية.

💡 نصيحة اليوم: المراجعة المنتظمة أفضل من الدراسة المكثفة قبل الامتحان!

كيف يمكنني مساعدتك؟`
    ]

    return greetings[Math.floor(Math.random() * greetings.length)]
  }

  private generateTopicResponse(topic: string, intentType: string): string {
    const topicData = TUNISIAN_DATA.topics[topic as keyof typeof TUNISIAN_DATA.topics]
    if (!topicData) return ''

    let response = `## 📚 ${topic}\n\n`

    if (intentType === 'explanation' || intentType === 'question') {
      response += `### التعريف:\n${topicData.definition}\n\n`

      if ('formula' in topicData) {
        response += `### الصيغة:\n\`${topicData.formula}\`\n\n`
      }

      if ('types' in topicData && Array.isArray(topicData.types)) {
        response += `### الأنواع:\n${topicData.types.map((t: string) => `• ${t}`).join('\n')}\n\n`
      }

      if ('laws' in topicData && Array.isArray(topicData.laws)) {
        response += `### القوانين:\n${topicData.laws.map((l: string) => `• ${l}`).join('\n')}\n\n`
      }

      if ('concepts' in topicData && Array.isArray(topicData.concepts)) {
        response += `### المفاهيم الأساسية:\n${topicData.concepts.map((c: string) => `• ${c}`).join('\n')}\n\n`
      }
    }

    if (intentType === 'example' || intentType === 'explanation') {
      if ('examples' in topicData && Array.isArray(topicData.examples)) {
        response += `### أمثلة تطبيقية:\n${topicData.examples.map((e: string) => `• \`${e}\``).join('\n')}\n\n`
      }

      if ('steps' in topicData && Array.isArray(topicData.steps)) {
        response += `### خطوات الحل:\n${topicData.steps.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}\n\n`
      }
    }

    response += `\n💡 **نصيحة:** ${this.getTipForTopic(topic)}`

    return response
  }

  private generateSubjectResponse(subject: string, message: string, intentType: string): string {
    const levelInfo = this.user.level ? TUNISIAN_DATA.levels[this.user.level as keyof typeof TUNISIAN_DATA.levels] : null
    const subjectData = levelInfo?.subjects[subject as keyof typeof levelInfo.subjects]

    let response = `## 📖 ${subject}\n\n`

    if (subjectData) {
      response += `### المواضيع المتاحة في ${subject}:\n`
      response += (subjectData as string[]).map((t: string) => `• ${t}`).join('\n')
      response += '\n\n'
    }

    response += `### كيف يمكنني مساعدتك في ${subject}؟

يمكنني:
• 📝 شرح أي مفهوم أو نظرية
• ✍️ حل التمارين خطوة بخطوة
• 📊 شرح القوانين والمعادلات
• 🎯 تقديم أمثلة تطبيقية

**مثال:** اكتب "اشرح لي المعادلات" أو "ما هو قانون أوم؟"`

    return response
  }

  private generateGeneralResponse(message: string, intent: { type: string; subject: string | null; topic: string | null; keywords: string[] }): string {
    // Check for specific patterns
    if (message.includes('بكالوريا') || message.includes('باك')) {
      return this.generateBacInfo()
    }

    if (message.includes('امتحان') || message.includes('اختبار')) {
      return this.generateExamTips()
    }

    if (message.includes('مذاكرة') || message.includes('دراسة') || message.includes('مراجعة')) {
      return this.generateStudyTips()
    }

    // Default helpful response
    return `شكراً لسؤالك! 🤔

أنا هنا لمساعدتك في دراستك. سؤالك يحتاج لمزيد من التوضيح.

💡 **يمكنني مساعدتك بشكل أفضل إذا:**
• حددت المادة (رياضيات، فيزياء، علوم...)
• ذكرت الموضوع المحدد (المعادلات، الدوال، الكهرباء...)

**أمثلة على أسئلة جيدة:**
• "ما هو قانون أوم؟"
• "اشرح لي المعادلات من الدرجة الثانية"
• "كيف أحل مسألة في الوراثة؟"

${this.user.subscription?.plan !== 'FREE' ? '✨ كمشترك، يمكنك الاستفادة من الشرح المفصل والتمارين الإضافية!' : ''}`
  }

  private generateBacInfo(): string {
    const bacData = TUNISIAN_DATA.levels.bac
    let response = `## 🎓 مرحلة البكالوريا\n\n`

    if (this.user.section && bacData.sections[this.user.section as keyof typeof bacData.sections]) {
      const sectionData = bacData.sections[this.user.section as keyof typeof bacData.sections]
      response += `### شعبتك: ${this.user.section}\n`
      response += `**المواد الأساسية:** ${sectionData.subjects.join('، ')}\n\n`
    } else {
      response += `### الشعب المتاحة:\n`
      for (const [section, data] of Object.entries(bacData.sections)) {
        response += `• **${section}:** ${data.subjects.join('، ')}\n`
      }
      response += '\n'
    }

    response += `### نصائح للبكالوريا:\n`
    response += TUNISIAN_DATA.exams.bac.tips.map((t: string) => `✓ ${t}`).join('\n')

    return response
  }

  private generateExamTips(): string {
    return `## 📝 نصائح للامتحانات

### قبل الامتحان:
• 📚 راجع الدروس بانتظام
• ⏰ ضع جدولاً للمراجعة
• 💤 نم جيداً الليلة السابقة
• 🍽️ تناول وجبة خفيفة قبل الامتحان

### أثناء الامتحان:
• اقرأ الأسئلة جيداً قبل البدء
• ابدأ بالأسئلة السهلة
• وزع وقتك على الأسئلة
• راجع إجاباتك قبل التسليم

### نصيحة ذهبية:
> "الهدوء والثقة بالنفس هما مفتاح النجاح! 💪"

هل تريد مساعدة في مادة معينة؟`
  }

  private generateStudyTips(): string {
    return `## 📚 طرق الدراسة الفعالة

### تقنية بومودورو:
• ادرس 25 دقيقة
• استرح 5 دقائق
• بعد 4 دورات، استرح 15-30 دقيقة

### التلخيص:
• استخرج النقاط الرئيسية
• استخدم الألوان للتمييز
• ارسم مخططات بيانية

### الحفظ:
• كرر المعلومة بصوت عالٍ
• اربطها بصور ذهنية
• علّمها لشخص آخر

### ${this.user.name ? `${this.user.name}، ` : ''}نصيحة خاصة:
بما أنك في ${this.user.levelName || 'مستواك الدراسي'}، ركز على فهم المفاهيم الأساسية قبل الانتقال للتطبيقات المتقدمة.

ما المادة التي تريد دراستها الآن؟`
  }

  private getTipForTopic(topic: string): string {
    const tips: Record<string, string> = {
      'المعادلات': 'ابدأ دائماً بتبسيط المعادلة قبل الحل.',
      'الدوال': 'ارسم البيان لفهم سلوك الدالة.',
      'الهندسة': 'ارسم الأشكال بدقة وتأكد من البيانات المعطاة.',
      'الكهرباء': 'تذكر أن التيار يسير من القطب الموجب للسالب.',
      'الميكانيكا': 'ارسم جسم حر وحدد جميع القوى المؤثرة.',
      'التفاعلات الكيميائية': 'تأكد من موازنة المعادلة أولاً.',
      'الوراثة': 'استخدم جداول بانيت لتحديد النتائج.',
      'الخلية': 'ارسم مخطط الخلية وحدد كل عضية.',
      'النحو': 'حدد الكلمة وأعربها خطوة بخطوة.',
      'البلاغة': 'ابحث عن وجه الشبه في التشبيه.',
      'الفلسفة': 'حدد المفاهيم الأساسية ثم العلاقات بينها.'
    }

    return tips[topic] || 'الممارسة المستمرة هي مفتاح الفهم!'
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
    const ai = new TunisianAI(user)
    const response = ai.generateResponse(message, options.history || [])

    return {
      success: true,
      content: response
    }
  } catch (error: unknown) {
    console.error('Chat error:', error)
    return {
      success: false,
      content: '',
      error: error instanceof Error ? error.message : 'حدث خطأ'
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

  // Generate contextual quiz questions
  const topicData = TUNISIAN_DATA.topics[topic as keyof typeof TUNISIAN_DATA.topics]

  const questions = []

  for (let i = 0; i < count; i++) {
    if (topicData) {
      questions.push({
        question: `سؤال ${i + 1} في ${topic}: ما هو ${topicData.definition.split('،')[0]}؟`,
        options: ['الخيار الأول', 'الخيار الثاني', 'الخيار الثالث', 'الخيار الرابع'],
        correctAnswer: 0,
        explanation: topicData.definition
      })
    } else {
      questions.push({
        question: `سؤال ${i + 1} في ${topic} - ما هي الإجابة الصحيحة؟`,
        options: ['الخيار أ', 'الخيار ب', 'الخيار ج', 'الخيار د'],
        correctAnswer: i % 4,
        explanation: `هذا شرح الإجابة الصحيحة للسؤال ${i + 1}`
      })
    }
  }

  return { success: true, questions }
}

export async function generateStudyPlan(
  subjects: string[],
  days: number,
  hoursPerDay: number,
  user: UserProfile,
  goal?: string
): Promise<{ success: boolean; plan?: string; error?: string }> {
  const daysOfWeek = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']

  let plan = `## 📚 خطة الدراسة المخصصة

### معلومات الطالب:
- **المستوى:** ${user.levelName || 'غير محدد'}
- **الشعبة:** ${user.section || 'غير محددة'}
- **المواد:** ${subjects.join('، ')}
- **المدة:** ${days} يوم
- **ساعات يومياً:** ${hoursPerDay} ساعة
${goal ? `- **الهدف:** ${goal}` : ''}

### 📅 الجدول الأسبوعي:\n\n`

  for (let i = 0; i < Math.min(days, 7); i++) {
    const day = daysOfWeek[i % 7]
    const subjectIndex = i % subjects.length
    const nextSubjectIndex = (i + 1) % subjects.length

    plan += `#### ${day}:\n`
    plan += `⏰ 08:00 - 10:00: **${subjects[subjectIndex]}** - المراجعة والفهم\n`
    plan += `⏰ 10:15 - 12:15: **${subjects[nextSubjectIndex]}** - التمارين والتطبيق\n`

    if (hoursPerDay >= 4) {
      plan += `☕ 12:15 - 14:00: استراحة غداء\n`
      plan += `⏰ 14:00 - 16:00: **${subjects[(subjectIndex + 2) % subjects.length]}** - الدروس الجديدة\n`
    }

    if (hoursPerDay >= 6) {
      plan += `⏰ 16:15 - 18:15: **مراجعة شاملة** - تلخيص اليوم\n`
    }

    plan += '\n'
  }

  plan += `### 💡 نصائح للدراسة الفعالة:\n`
  plan += `1. ابدأ بالصعب عندما تكون نشيطاً\n`
  plan += `2. خذ استراحة 10 دقائق كل 50 دقيقة\n`
  plan += `3. راجع ما درسته قبل النوم\n`
  plan += `4. حل تمارين سابقة بانتظام\n`
  plan += `5. استخدم الملخصات والخرائط الذهنية\n`

  return { success: true, plan }
}

export async function generateSummary(
  content: string,
  user: UserProfile
): Promise<{ success: boolean; summary?: string; error?: string }> {
  // Extract key sentences
  const sentences = content.split(/[.؟!؟\n]+/).filter(s => s.trim().length > 20)
  const keyPoints = sentences.slice(0, 5)

  const summary = `## 📝 ملخص المحتوى

### النقاط الرئيسية:
${keyPoints.map((p, i) => `${i + 1}. ${p.trim()}`).join('\n')}

### 💡 الخلاصة:
تم تلخيص المحتوى في ${keyPoints.length} نقاط رئيسية. للمزيد من التفاصيل، راجع المحتوى الأصلي.

---
*ملخص مخصص للمستوى: ${user.levelName || 'عام'}*`

  return { success: true, summary }
}

export async function generateFlashcards(
  topic: string,
  user: UserProfile,
  count: number = 8
): Promise<{ success: boolean; flashcards?: { question: string; answer: string }[]; error?: string }> {
  const topicData = TUNISIAN_DATA.topics[topic as keyof typeof TUNISIAN_DATA.topics]

  const flashcards = []

  if (topicData) {
    flashcards.push({
      question: `ما هو تعريف ${topic}؟`,
      answer: topicData.definition
    })

    if ('laws' in topicData && Array.isArray(topicData.laws)) {
      topicData.laws.slice(0, 3).forEach((law: string) => {
        flashcards.push({
          question: `ما هو ${law.split(':')[0]}؟`,
          answer: law.includes(':') ? law.split(':')[1].trim() : law
        })
      })
    }

    if ('concepts' in topicData && Array.isArray(topicData.concepts)) {
      topicData.concepts.slice(0, 2).forEach((concept: string) => {
        flashcards.push({
          question: `اشرح: ${concept}`,
          answer: `${concept} هو من المفاهيم الأساسية في ${topic}.`
        })
      })
    }
  }

  // Fill remaining cards
  while (flashcards.length < count) {
    flashcards.push({
      question: `سؤال ${flashcards.length + 1} في ${topic}`,
      answer: `الإجابة على السؤال ${flashcards.length + 1}`
    })
  }

  return { success: true, flashcards: flashcards.slice(0, count) }
}

export async function webSearch(
  query: string,
  user?: UserProfile,
  numResults: number = 5
): Promise<{ success: boolean; results?: SearchResult[]; error?: string }> {
  // Simulated search results with Tunisian focus
  const results: SearchResult[] = [
    {
      url: `https://education.tn/${encodeURIComponent(query)}`,
      name: `مصادر تعليمية تونسية: ${query}`,
      snippet: `معلومات تعليمية حول ${query} من المناهج التونسية للطلاب.`,
      source: 'education.tn'
    },
    {
      url: `https://bac.tn/search?q=${encodeURIComponent(query)}`,
      name: `مراجع البكالوريا: ${query}`,
      snippet: `تمارين وحلول لموضوع ${query} لطلاب البكالوريا التونسية.`,
      source: 'bac.tn'
    },
    {
      url: `https://wiki.tn/${encodeURIComponent(query)}`,
      name: `الموسوعة التونسية: ${query}`,
      snippet: `مقالة شاملة عن ${query} مع معلومات مفصلة.`,
      source: 'wiki.tn'
    }
  ]

  return { success: true, results: results.slice(0, numResults) }
}

export async function generateSupportResponse(
  ticketTitle: string,
  ticketMessage: string,
  category: string,
  user: UserProfile
): Promise<string> {
  return `شكراً لتواصلك معنا ${user.name || ''}! 🙏

نحن هنا لمساعدتك. استلمنا رسالتك وسنقوم بالرد عليها في أقرب وقت ممكن.

**موضوع رسالتك:** ${ticketTitle}

إذا كانت المسألة عاجلة، يمكنك التواصل معنا عبر:
• واتساب: +216 24 239 724
• البريد: support@qraya.tn

تحياتنا،
فريق دعم مساعد دراسة تونسي 🇹🇳`
}

export { TUNISIAN_DATA, TunisianAI }
