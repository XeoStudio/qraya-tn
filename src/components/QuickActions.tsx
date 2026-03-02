'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { 
  BookOpen, 
  FileText, 
  Calendar, 
  Target, 
  Layers,
  Sparkles
} from 'lucide-react'

interface QuickActionsProps {
  onAction: (action: string) => void
  isAuthenticated: boolean
}

const actions = [
  {
    id: 'explain',
    icon: BookOpen,
    title: 'شرح مفهوم',
    description: 'احصل على شرح مبسط لأي درس أو مفهوم',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20'
  },
  {
    id: 'summarize',
    icon: FileText,
    title: 'تلخيص مادة',
    description: 'لخص المحتوى التعليمي بنقاط رئيسية',
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20'
  },
  {
    id: 'study-plan',
    icon: Calendar,
    title: 'خطة دراسة',
    description: 'أنشئ خطة دراسة مخصصة لك',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20'
  },
  {
    id: 'quiz',
    icon: Target,
    title: 'أسئلة تدريبية',
    description: 'تمرن بأسئلة MCQ مع التصحيح',
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20'
  },
  {
    id: 'flashcards',
    icon: Layers,
    title: 'بطاقات مراجعة',
    description: 'بطاقات سريعة للمراجعة',
    color: 'from-pink-500 to-pink-600',
    bgColor: 'bg-pink-50 dark:bg-pink-900/20'
  }
]

export default function QuickActions({ onAction, isAuthenticated }: QuickActionsProps) {
  const handleClick = (actionId: string) => {
    if (!isAuthenticated) {
      onAction('login')
      return
    }
    onAction(actionId)
  }

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>أدوات الدراسة</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            كل ما تحتاجه للدراسة
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            أدوات ذكية مصممة خصيصاً للطلاب التونسيين لمساعدتك في رحلتك الدراسية
          </p>
        </motion.div>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {actions.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card
                onClick={() => handleClick(action.id)}
                className={`${action.bgColor} p-6 border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer group h-full`}
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <action.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {action.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        {!isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <p className="text-gray-600 dark:text-gray-400">
              سجل مجاناً للوصول إلى جميع الأدوات
            </p>
          </motion.div>
        )}
      </div>
    </section>
  )
}
