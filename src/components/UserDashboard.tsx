'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Crown, 
  Star, 
  Gift, 
  Trophy, 
  Flame, 
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2,
  Ticket,
  MapPin
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import SupportTickets from '@/components/SupportTickets'
import { TUNISIAN_GOVERNORATES, PLANS } from '@/lib/constants'

interface UserDashboardProps {
  onClose?: () => void
  onShowPricing: () => void
}

const planLabels: Record<string, string> = {
  FREE: 'مجاني',
  BASIC: 'أساسي',
  PREMIUM: 'متقدم',
  BAC_PRO: 'باك برو'
}

export default function UserDashboard({ onShowPricing }: UserDashboardProps) {
  const { user, subscription, logout, refreshUser } = useAuth()
  const [promoCode, setPromoCode] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null)

  if (!user) return null

  const handleActivatePromo = async () => {
    if (!promoCode) return
    
    setPromoLoading(true)
    setPromoError(null)
    setPromoSuccess(null)

    try {
      const res = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode }),
        credentials: 'include'
      })

      const data = await res.json()

      if (data.success) {
        setPromoSuccess(data.message || 'تم تفعيل الكود بنجاح!')
        setPromoCode('')
        await refreshUser()
      } else {
        setPromoError(data.error || 'فشل تفعيل الكود')
      }
    } catch {
      setPromoError('حدث خطأ في الاتصال')
    } finally {
      setPromoLoading(false)
    }
  }

  const getPlanIcon = (plan: string | undefined) => {
    switch (plan) {
      case 'PREMIUM':
      case 'BAC_PRO':
        return <Crown className="w-6 h-6 text-purple-500" />
      case 'BASIC':
        return <Zap className="w-6 h-6 text-blue-500" />
      default:
        return <Gift className="w-6 h-6 text-gray-400" />
    }
  }

  const getGovernorateLabel = (value: string | null) => {
    if (!value) return 'غير محدد'
    return TUNISIAN_GOVERNORATES.find(g => g.value === value)?.label || value
  }

  const usagePercent = subscription ? Math.min((subscription.chatsUsed / subscription.quotaLimit) * 100, 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            مرحباً، {user.name || 'طالب'}! 👋
          </h2>
          <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
            {user.levelName || 'لم تحدد المستوى الدراسي بعد'}
            {user.governorate && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {getGovernorateLabel(user.governorate)}
                </span>
              </>
            )}
            {user.role === 'ADMIN' && (
              <Badge className="mr-2 bg-purple-500">مدير النظام</Badge>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={logout}
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          تسجيل الخروج
        </Button>
      </div>

      <Tabs defaultValue="subscription" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="subscription">الاشتراك</TabsTrigger>
          <TabsTrigger value="tickets">التذاكر</TabsTrigger>
          <TabsTrigger value="achievements">الإنجازات</TabsTrigger>
          <TabsTrigger value="stats">الإحصائيات</TabsTrigger>
        </TabsList>

        {/* Subscription Tab */}
        <TabsContent value="subscription">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Plan */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                {getPlanIcon(subscription?.plan)}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    الخطة الحالية
                  </h3>
                  <Badge variant={subscription?.plan === 'FREE' ? 'secondary' : 'default'}>
                    {planLabels[subscription?.plan || 'FREE']}
                  </Badge>
                </div>
              </div>

              {/* Usage */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">الاستخدام اليومي</span>
                  <span className="text-gray-900 dark:text-white">
                    {subscription?.chatsUsed || 0} / {subscription?.unlimitedChat ? '∞' : subscription?.quotaLimit || 50}
                  </span>
                </div>
                <Progress value={usagePercent} className="h-2" />
              </div>

              {/* Plan Limits */}
              {subscription?.plan === 'FREE' && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg mb-4">
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    لديك {PLANS.FREE.chats - (subscription?.chatsUsed || 0)} محادثات متبقية اليوم
                  </p>
                </div>
              )}

              {/* Features */}
              <div className="space-y-2">
                <FeatureItem active={subscription?.agentMode} label="وضع المعلم الذكي" />
                <FeatureItem active={subscription?.advancedAI} label="ذكاء اصطناعي متقدم" />
                <FeatureItem active={subscription?.exportPDF} label="تصدير PDF" />
                <FeatureItem active={subscription?.priority} label="أولوية في الرد" />
              </div>

              {subscription?.plan === 'FREE' && (
                <Button
                  onClick={onShowPricing}
                  className="w-full mt-4 bg-gradient-to-r from-purple-500 to-purple-600"
                >
                  <Star className="w-4 h-4 mr-2" />
                  ترقية الآن
                </Button>
              )}
            </Card>

            {/* Promo Code */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                تفعيل كود الترقية
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                إذا كان لديك كود تفعيل، أدخله هنا للحصول على المميزات
              </p>
              
              <div className="space-y-3">
                <Input
                  placeholder="أدخل كود التفعيل"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="text-center text-lg tracking-widest"
                  dir="ltr"
                />
                
                {promoError && (
                  <div className="flex items-center gap-2 text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {promoError}
                  </div>
                )}
                
                {promoSuccess && (
                  <div className="flex items-center gap-2 text-green-500 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    {promoSuccess}
                  </div>
                )}
                
                <Button
                  onClick={handleActivatePromo}
                  disabled={!promoCode || promoLoading}
                  className="w-full"
                >
                  {promoLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      جاري التفعيل...
                    </>
                  ) : (
                    'تفعيل الكود'
                  )}
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Tickets Tab */}
        <TabsContent value="tickets">
          <SupportTickets />
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements">
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {user.points} نقطة
                </h3>
                <p className="text-gray-500">استمر في جمع النقاط!</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <AchievementCard
                icon={<span className="text-2xl">👋</span>}
                title="مرحباً بك"
                description="أنشأت حسابك"
                earned={true}
              />
              <AchievementCard
                icon={<span className="text-2xl">🔥</span>}
                title="متحمس"
                description="سلسلة 7 أيام"
                earned={user.streak >= 7}
              />
              <AchievementCard
                icon={<span className="text-2xl">⚡</span>}
                title="مثابر"
                description="سلسلة 30 يوم"
                earned={user.streak >= 30}
              />
              <AchievementCard
                icon={<span className="text-2xl">⭐</span>}
                title="نجم لامع"
                description="100 نقطة"
                earned={user.points >= 100}
              />
              <AchievementCard
                icon={<span className="text-2xl">🌟</span>}
                title="عالم نشيط"
                description="500 نقطة"
                earned={user.points >= 500}
              />
              <AchievementCard
                icon={<span className="text-2xl">👑</span>}
                title="ملك الدراسة"
                description="1000 نقطة"
                earned={user.points >= 1000}
              />
              <AchievementCard
                icon={<span className="text-2xl">🎯</span>}
                title="بطل الأسئلة"
                description="50 سؤال صحيح"
                earned={false}
              />
              <AchievementCard
                icon={<span className="text-2xl">📝</span>}
                title="الملخص"
                description="10 ملخصات"
                earned={false}
              />
            </div>
          </Card>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="النقاط" value={user.points} icon={<Star className="w-5 h-5 text-amber-500" />} />
            <StatCard label="سلسلة الأيام" value={user.streak} icon={<Flame className="w-5 h-5 text-orange-500" />} />
            <StatCard label="المحادثات" value={subscription?.chatsUsed || 0} icon={<Zap className="w-5 h-5 text-blue-500" />} />
            <StatCard label="المستوى" value={user.levelName || '-'} icon={<Trophy className="w-5 h-5 text-purple-500" />} />
          </div>

          {/* Quick Actions */}
          <Card className="p-6 mt-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              اختصارات سريعة
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <QuickActionBtn icon={<Zap className="w-5 h-5" />} label="المحادثة" view="chat" />
              <QuickActionBtn icon={<Star className="w-5 h-5" />} label="الأدوات" view="tools" />
              <QuickActionBtn icon={<Ticket className="w-5 h-5" />} label="الدعم" view="tickets" />
              <QuickActionBtn icon={<Crown className="w-5 h-5" />} label="الترقية" onClick={onShowPricing} />
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}

function FeatureItem({ active, label }: { active?: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle className={`w-5 h-5 ${active ? 'text-green-500' : 'text-gray-300'}`} />
      <span className={active ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>
        {label}
      </span>
    </div>
  )
}

function AchievementCard({ 
  icon, 
  title, 
  description, 
  earned 
}: { 
  icon: React.ReactNode
  title: string
  description: string
  earned: boolean
}) {
  return (
    <Card className={`p-4 text-center ${earned ? 'bg-amber-50 dark:bg-amber-900/20' : 'opacity-50'}`}>
      <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
        earned ? 'bg-amber-100 dark:bg-amber-900/50' : 'bg-gray-100 dark:bg-gray-800'
      }`}>
        {icon}
      </div>
      <h4 className="font-medium text-gray-900 dark:text-white text-sm">{title}</h4>
      <p className="text-xs text-gray-500">{description}</p>
    </Card>
  )
}

function StatCard({ 
  label, 
  value, 
  icon 
}: { 
  label: string
  value: number | string
  icon: React.ReactNode
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </Card>
  )
}

function QuickActionBtn({ 
  icon, 
  label, 
  view,
  onClick 
}: { 
  icon: React.ReactNode
  label: string
  view?: string
  onClick?: () => void
}) {
  return (
    <Button
      variant="outline"
      className="flex flex-col items-center gap-2 h-auto py-4"
      onClick={onClick}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </Button>
  )
}
