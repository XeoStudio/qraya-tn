'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Star, Crown, Zap, GraduationCap } from 'lucide-react'
import { PLANS } from '@/lib/constants'

interface PricingSectionProps {
  onContact: () => void
}

const plansList = [
  {
    ...PLANS.BASIC,
    icon: Zap,
    id: 'basic'
  },
  {
    ...PLANS.PREMIUM,
    icon: Star,
    id: 'premium'
  },
  {
    ...PLANS.BAC_PRO,
    icon: Crown,
    id: 'bac_pro'
  }
]

export default function PricingSection({ onContact }: PricingSectionProps) {
  return (
    <section className="py-20 bg-white dark:bg-gray-800" id="pricing">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            خطط الاشتراك
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            اختر الخطة المناسبة لك. جميع الخطط شهرية ويمكن إلغاؤها في أي وقت.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plansList.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative ${plan.popular ? 'md:-translate-y-4' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium z-10">
                  الأكثر شعبية
                </div>
              )}
              <Card className={`p-6 border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full ${
                plan.popular 
                  ? 'bg-gradient-to-b from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800 ring-2 ring-purple-500' 
                  : 'bg-white dark:bg-gray-800'
              }`}>
                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${plan.color} flex items-center justify-center mb-4`}>
                  <plan.icon className="w-7 h-7 text-white" />
                </div>

                {/* Plan Name */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {plan.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {plan.id === 'bac_pro' ? 'لطلاب الباكالوريا' : 'للطلاب المتميزين'}
                </p>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {plan.price}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 mr-1">
                    DT
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    /شهري
                  </span>
                </div>

                {/* Duration Badge for BAC_PRO */}
                {plan.id === 'bac_pro' && (
                  <div className="mb-4 flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
                    <GraduationCap className="w-4 h-4" />
                    <span>مدة 4 أشهر (لمدة الباكالوريا)</span>
                  </div>
                )}

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  onClick={onContact}
                  className={`w-full ${
                    plan.popular
                      ? `bg-gradient-to-r ${plan.color} hover:opacity-90`
                      : 'bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600'
                  } text-white rounded-xl py-6`}
                >
                  اشترك الآن
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Free Plan Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl max-w-md mx-auto"
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">
            💡 الخطة المجانية تمنحك <strong>10 محادثات</strong> و <strong>3 استخراج نصوص</strong> يومياً مجاناً
          </p>
        </motion.div>

        {/* Contact Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12 p-6 bg-gray-50 dark:bg-gray-900 rounded-2xl max-w-2xl mx-auto"
        >
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            للتواصل والاشتراك عبر واتساب
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white" dir="ltr">
            +216 24 239 724
          </p>
        </motion.div>
      </div>
    </section>
  )
}
