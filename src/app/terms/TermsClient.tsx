'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { FileText, Check, X, AlertTriangle, Scale, RefreshCw, Ban, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function TermsClient() {
  const sections = [
    {
      icon: FileText,
      title: 'قبول الشروط',
      content: `باستخدامك لمنصة "مساعد دراسة تونسي"، فإنك توافق على الالتزام بهذه الشروط. إذا كنت لا توافق على أي جزء منها، يرجى التوقف عن استخدام المنصة.`
    },
    {
      icon: Check,
      title: 'الاستخدام المسموح',
      content: `يُسمح لك باستخدام المنصة للأغراض التالية:

• التعلم والدراسة الشخصية
• طرح الأسئلة التعليمية
• استخدام أدوات التلخيص والمراجعة
• إنشاء خطط دراسية شخصية
• التواصل مع فريق الدعم`
    },
    {
      icon: X,
      title: 'الاستخدام المحظور',
      content: `يُحظر استخدام المنصة لـ:

• نشر محتوى مسيء أو غير لائق
• محاولة اختراق المنصة أو قواعد البيانات
• استخدام حسابات الآخرين دون إذن
• نسخ أو إعادة بيع المحتوى
• إنشاء حسابات وهمية متعددة
• إساءة استخدام الذكاء الاصطناعي`
    },
    {
      icon: CreditCard,
      title: 'الاشتراكات والدفع',
      content: `شروط الاشتراكات:

• جميع الخطط شهرية ما لم يُذكر خلاف ذلك
• الدفع عبر بطاقات الشحن أو واتساب
• لا يوجد استرداد بعد تفعيل الاشتراك
• يمكن إلغاء الاشتراك في أي وقت
• التنبيه قبل انتهاء الاشتراك بـ 3 أيام`
    },
    {
      icon: Scale,
      title: 'الملكية الفكرية',
      content: `جميع المحتوى على المنصة محمي بحقوق الملكية الفكرية:

• المحتوى التعليمي: ملك لمنصة مساعد دراسة تونسي
• المحتوى المُنشأ بواسطة AI: للاستخدام الشخصي فقط
• العلامات التجارية والشعارات: محمية قانونياً
• لا يجوز إعادة نشر المحتوى دون إذن مكتوب`
    },
    {
      icon: Ban,
      title: 'الإيقاف والحظر',
      content: `يحق لنا حظر أو إيقاف حسابك في الحالات التالية:

• انتهاك شروط الاستخدام
• سلوك مسيء أو غير لائق
• الاحتيال أو محاولة الاحتيال
• إنشاء محتوى غير قانوني
• إساءة استخدام الخدمة

يمكنك الاستئناف عبر الدعم الفني.`
    },
    {
      icon: RefreshCw,
      title: 'تحديث الشروط',
      content: `نحتفظ بالحق في تعديل هذه الشروط في أي وقت:

• سيتم إشعارك بالتغييرات عبر البريد الإلكتروني
• استمرار استخدامك للمنصة يعني موافقتك
• يمكنك إغلاق حسابك إذا لم توافق على التغييرات`
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              شروط الاستخدام
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              آخر تحديث: مارس 2026
            </p>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {sections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 border-0 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <section.icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {section.title}
                    </h2>
                  </div>
                  <div className="text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                    {section.content}
                  </div>
                </Card>
              </motion.div>
            ))}

            {/* Warning */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card className="p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                      تنبيه قانوني
                    </h3>
                    <p className="text-red-700 dark:text-red-300 text-sm">
                      في حال انتهاك شروط الاستخدام، يحق لنا اتخاذ إجراءات قانونية according للقوانين التونسية.
                      المنصة غير مسؤولة عن الأضرار غير المباشرة الناتجة عن استخدام الخدمة.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Contact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-center"
            >
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                لديك أسئلة حول شروط الاستخدام؟
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link href="/contact">
                  <Button variant="outline" className="gap-2">
                    تواصل معنا
                  </Button>
                </Link>
                <Link href="/support">
                  <Button className="bg-purple-600 hover:bg-purple-700 gap-2">
                    مركز الدعم
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Back Link */}
            <div className="text-center pt-6">
              <Link href="/" className="text-purple-600 hover:underline">
                ← العودة للصفحة الرئيسية
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
