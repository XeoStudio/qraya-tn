'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Shield, Lock, Eye, Database, Bell, UserCheck, Globe, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function PrivacyClient() {
  const sections = [
    {
      icon: Database,
      title: 'البيانات التي نجمعها',
      content: `نقوم بجمع البيانات التالية لتحسين تجربتك:
      
• معلومات الحساب: الاسم، البريد الإلكتروني، المستوى الدراسي، الولاية
• بيانات الاستخدام: المحادثات، الأسئلة، الإحصائيات الدراسية
• بيانات الجهاز: نوع المتصفح، نظام التشغيل، عنوان IP
• ملفات تعريف الارتباط: لتحسين الأداء وتخصيص المحتوى`
    },
    {
      icon: Shield,
      title: 'كيف نستخدم بياناتك',
      content: `نستخدم بياناتك للأغراض التالية فقط:

• توفير الخدمات التعليمية والمساعدة الدراسية
• تحسين جودة الردود والمحتوى المقدم
• تخصيص التجربة حسب مستواك الدراسي
• إرسال إشعارات مهمة حول حسابك
• تحليل الأداء وتطوير المنصة`
    },
    {
      icon: Lock,
      title: 'حماية البيانات',
      content: `نلتزم بأعلى معايير الأمان:

• تشفير كلمات المرور بخوارزمية bcrypt
• تشفير الاتصال عبر HTTPS
• حماية من هجمات XSS و CSRF
• نسخ احتياطي يومي للبيانات
• صلاحيات وصول محدودة للفريق التقني`
    },
    {
      icon: Eye,
      title: 'حقوقك',
      content: `لديك الحق في:

• الاطلاع على جميع بياناتك الشخصية
• تعديل أو تحديث معلوماتك
• طلب حذف حسابك وبياناتك
• تصدير بياناتك بتنسيق قابل للقراءة
• الاعتراض على معالجة بياناتك`
    },
    {
      icon: UserCheck,
      title: 'مشاركة البيانات',
      content: `لا نشارك بياناتك مع أي طرف ثالث إلا:

• بموافقتك الصريحة
• لتنفيذ طلبات الدفع
• للامتثال للقوانين والأنظمة
• لحماية حقوقنا القانونية`
    },
    {
      icon: Globe,
      title: 'ملفات تعريف الارتباط',
      content: `نستخدم ملفات تعريف الارتباط لـ:

• الحفاظ على تسجيل دخولك
• تذكر تفضيلاتك
• تحليل حركة الموقع
• تحسين تجربة المستخدم

يمكنك تعطيلها من إعدادات متصفحك.`
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              سياسة الخصوصية
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
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <section.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
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

            {/* Important Notice */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="p-6 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                      ملاحظة مهمة
                    </h3>
                    <p className="text-amber-700 dark:text-amber-300 text-sm">
                      باستخدامك لمنصة مساعد دراسة تونسي، فإنك توافق على سياسة الخصوصية هذه. 
                      نحتفظ بالحق في تعديل هذه السياسة في أي وقت، وسيتم إشعارك بأي تغييرات جوهرية.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Contact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="text-center"
            >
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                لديك أسئلة حول سياسة الخصوصية؟
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link href="/contact">
                  <Button variant="outline" className="gap-2">
                    <Bell className="w-4 h-4" />
                    تواصل معنا
                  </Button>
                </Link>
                <Link href="/support">
                  <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                    <AlertCircle className="w-4 h-4" />
                    مركز الدعم
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Back Link */}
            <div className="text-center pt-6">
              <Link href="/" className="text-blue-600 hover:underline">
                ← العودة للصفحة الرئيسية
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
