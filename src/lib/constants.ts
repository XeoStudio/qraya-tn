// خطط الاشتراك الشهرية
export const PLANS = {
  FREE: {
    id: 'FREE',
    name: 'مجاني',
    nameEn: 'FREE',
    price: 0,
    chats: 10,
    ocr: 3,
    duration: null, // لا يوجد مدة
    features: [
      '10 محادثات يومياً',
      '3 استخراج نصوص من الصور يومياً',
      'تلخيص المحتوى',
      'أسئلة تدريبية'
    ],
    color: 'from-gray-500 to-gray-600',
    popular: false
  },
  BASIC: {
    id: 'BASIC',
    name: 'أساسي',
    nameEn: 'BASIC',
    price: 9.99,
    chats: 50,
    ocr: 20,
    duration: 30, // 30 يوم
    features: [
      '50 محادثة يومياً',
      '20 استخراج نصوص من الصور يومياً',
      'وضع المعلم الذكي',
      'تلخيص المحتوى',
      'أسئلة تدريبية',
      'دعم عبر الرسائل'
    ],
    color: 'from-blue-500 to-blue-600',
    popular: false
  },
  PREMIUM: {
    id: 'PREMIUM',
    name: 'متقدم',
    nameEn: 'PREMIUM',
    price: 19.99,
    chats: Infinity,
    ocr: Infinity,
    duration: 30, // 30 يوم
    features: [
      'محادثات غير محدودة',
      'استخراج نصوص غير محدود',
      '🤖 وضع الوكيل الذكي (Agent)',
      'إنشاء امتحانات واختبارات',
      'إنشاء ملفات وملخصات PDF',
      'ذكاء اصطناعي متقدم',
      'أولوية في الرد',
      'تصدير PDF',
      'خطط دراسة مخصصة',
      'بطاقات مراجعة محفوظة'
    ],
    color: 'from-purple-500 to-purple-600',
    popular: true
  },
  BAC_PRO: {
    id: 'BAC_PRO',
    name: 'باك برو',
    nameEn: 'BAC_PRO',
    price: 29.99,
    chats: Infinity,
    ocr: Infinity,
    duration: 120, // 4 أشهر (لمدة الباكالوريا)
    features: [
      'جميع مميزات المتقدم',
      '🤖 وضع الوكيل الذكي (Agent)',
      'إنشاء امتحانات الباكالوريا',
      'نماذج امتحانات سابقة محلولة',
      'ملخصات جميع المواد',
      'خطط مراجعة للباكالوريا',
      'دعم VIP على واتساب',
      'تحديثات مجانية خلال الفترة'
    ],
    color: 'from-amber-500 to-amber-600',
    popular: false
  }
} as const

export type PlanType = keyof typeof PLANS

// الولايات التونسية الـ 24
export const TUNISIAN_GOVERNORATES = [
  { value: 'ariana', label: 'أريانة' },
  { value: 'beja', label: 'باجة' },
  { value: 'ben_arous', label: 'بن عروس' },
  { value: 'bizerte', label: 'بنزرت' },
  { value: 'gabes', label: 'قابس' },
  { value: 'gafsa', label: 'قفصة' },
  { value: 'jendouba', label: 'جندوبة' },
  { value: 'kairouan', label: 'القيروان' },
  { value: 'kasserine', label: 'القصرين' },
  { value: 'kebili', label: 'قبلي' },
  { value: 'kef', label: 'الكاف' },
  { value: 'mahdia', label: 'المهدية' },
  { value: 'manouba', label: 'منوبة' },
  { value: 'medenine', label: 'مدنين' },
  { value: 'monastir', label: 'المنستير' },
  { value: 'nabeul', label: 'نابل' },
  { value: 'sfax', label: 'صفاقس' },
  { value: 'sidi_bouzid', label: 'سيدي بوزيد' },
  { value: 'siliana', label: 'سليانة' },
  { value: 'sousse', label: 'سوسة' },
  { value: 'tataouine', label: 'تطاوين' },
  { value: 'tozeur', label: 'توزر' },
  { value: 'tunis', label: 'تونس' },
  { value: 'zaghouan', label: 'زغوان' }
] as const

export type Governorate = typeof TUNISIAN_GOVERNORATES[number]['value']

// المستويات الدراسية
export const STUDY_LEVELS = [
  { value: 'primary', label: 'الابتدائي' },
  { value: 'preparatory', label: 'الإعدادي' },
  { value: 'secondary', label: 'الثانوي' },
  { value: 'bac', label: 'الباكالوريا' }
] as const

export const YEARS_BY_LEVEL: Record<string, string[]> = {
  primary: ['السنة الأولى', 'السنة الثانية', 'السنة الثالثة', 'السنة الرابعة', 'السنة الخامسة', 'السنة السادسة'],
  preparatory: ['السنة الأولى', 'السنة الثانية', 'السنة الثالثة'],
  secondary: ['السنة الأولى', 'السنة الثانية', 'السنة الثالثة', 'السنة الرابعة'],
  bac: ['باكالوريا 2025', 'باكالوريا 2026']
}

export const SECTIONS_BY_LEVEL: Record<string, string[]> = {
  primary: [],
  preparatory: [],
  secondary: ['آداب', 'علوم تجريبية', 'علوم تقنية', 'رياضيات', 'إعلامية', 'اقتصاد'],
  bac: ['آداب', 'علوم تجريبية', 'علوم تقنية', 'رياضيات', 'إعلامية', 'اقتصاد']
}

// تصنيفات التذاكر
export const TICKET_CATEGORIES = [
  { value: 'GENERAL', label: 'استفسار عام' },
  { value: 'TECHNICAL', label: 'مشكلة تقنية' },
  { value: 'BILLING', label: 'الفواتير والاشتراكات' },
  { value: 'SUGGESTION', label: 'اقتراح' }
] as const

export const TICKET_PRIORITIES = [
  { value: 'LOW', label: 'منخفضة' },
  { value: 'MEDIUM', label: 'متوسطة' },
  { value: 'HIGH', label: 'عالية' },
  { value: 'URGENT', label: 'عاجلة' }
] as const

export const TICKET_STATUS_LABELS: Record<string, string> = {
  OPEN: 'مفتوحة',
  IN_PROGRESS: 'قيد المعالجة',
  WAITING_USER: 'بانتظار ردك',
  RESOLVED: 'تم الحل',
  CLOSED: 'مغلقة'
}

// أنواع الإنجازات
export const ACHIEVEMENT_TYPES = [
  { type: 'first_login', title: 'مرحباً بك', description: 'أنشأت حسابك', icon: '👋', points: 10 },
  { type: 'first_chat', title: 'البداية', description: 'أول محادثة مع المساعد', icon: '💬', points: 20 },
  { type: 'streak_7', title: 'متحمس', description: 'سلسلة 7 أيام متتالية', icon: '🔥', points: 50 },
  { type: 'streak_30', title: 'مثابر', description: 'سلسلة 30 يوم متتالية', icon: '⚡', points: 200 },
  { type: 'points_100', title: 'نجم لامع', description: 'جمعت 100 نقطة', icon: '⭐', points: 0 },
  { type: 'points_500', title: 'عالم نشيط', description: 'جمعت 500 نقطة', icon: '🌟', points: 0 },
  { type: 'points_1000', title: 'ملك الدراسة', description: 'جمعت 1000 نقطة', icon: '👑', points: 0 },
  { type: 'quiz_master', title: 'بطل الأسئلة', description: 'أجبت على 50 سؤال صحيح', icon: '🎯', points: 100 },
  { type: 'summarizer', title: 'الملخص', description: 'لخصت 10 دروس', icon: '📝', points: 50 }
] as const

// ألوان الموقع
export const BRAND_COLORS = {
  primary: 'from-blue-600 to-purple-600',
  secondary: 'from-gray-100 to-gray-200',
  success: 'from-green-500 to-green-600',
  warning: 'from-amber-500 to-amber-600',
  error: 'from-red-500 to-red-600'
}

// رسائل الخطأ العربية
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'حدث خطأ في الاتصال. تأكد من اتصالك بالإنترنت.',
  UNAUTHORIZED: 'يجب تسجيل الدخول أولاً',
  SESSION_EXPIRED: 'انتهت جلستك، يرجى تسجيل الدخول مرة أخرى',
  RATE_LIMIT: 'لقد تجاوزت الحد المسموح، حاول لاحقاً',
  QUOTA_EXCEEDED: 'لقد استنفذت حدك اليومي، قم بالترقية للمتابعة',
  INVALID_INPUT: 'يرجى التحقق من البيانات المدخلة',
  AI_ERROR: 'حدث خطأ في معالجة طلبك، حاول مرة أخرى',
  TIMEOUT: 'انتهت مهلة الطلب، يرجى المحاولة مرة أخرى',
  UNKNOWN: 'حدث خطأ غير متوقع'
}

// مهلة الانتظار (60 ثانية - أكثر مرونة)
export const AI_TIMEOUT = 60000
