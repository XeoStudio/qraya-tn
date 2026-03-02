'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  RefreshCw, 
  Loader2,
  Users,
  Crown,
  MapPin,
  Star,
  Calendar,
  BarChart3,
  Activity,
  Target
} from 'lucide-react'

interface AdvancedStats {
  usersByDay: Array<{ date: string; count: number }>
  chatsByDay: Array<{ date: string; count: number }>
  planDistribution: Array<{ plan: string; _count: { id: number } }>
  activeToday: number
  activeThisWeek: number
  newSubscriptionsThisWeek: number
  expiringSubscriptions: number
  totalPoints: number
  avgPoints: number
  topUsers: Array<{
    id: string
    name: string | null
    email: string
    points: number
    streak: number
  }>
  usersByLevel: Array<{ level: string; _count: { id: number } }>
  usersByGovernorate: Array<{ governorate: string; _count: { id: number } }>
}

export default function AdminAdvancedStats() {
  const [stats, setStats] = useState<AdvancedStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin?action=advanced-stats', { credentials: 'include' })
      const data = await res.json()
      if (data.success) {
        setStats(data.advancedStats)
      }
    } catch (error) {
      console.error('Error fetching advanced stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const planLabels: Record<string, string> = {
    FREE: 'مجاني',
    BASIC: 'أساسي',
    PREMIUM: 'متقدم',
    BAC_PRO: 'باك برو'
  }

  const planColors: Record<string, string> = {
    FREE: 'bg-gray-500',
    BASIC: 'bg-blue-500',
    PREMIUM: 'bg-purple-500',
    BAC_PRO: 'bg-amber-500'
  }

  const levelLabels: Record<string, string> = {
    primary: 'ابتدائي',
    preparatory: 'إعدادي',
    secondary: 'ثانوي',
    bac: 'باكالوريا'
  }

  const governorateLabels: Record<string, string> = {
    tunis: 'تونس',
    ariana: 'أريانة',
    ben_arous: 'بن عروس',
    manouba: 'منوبة',
    sfax: 'صفاقس',
    sousse: 'سوسة',
    nabeul: 'نابل',
    monastir: 'المنستير',
    bizerte: 'بنزرت',
    gabes: 'قابس'
  }

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">لا توجد بيانات</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-500" />
          إحصائيات متقدمة
        </h3>
        <Button onClick={fetchStats} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          تحديث
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-500" />
            <span className="text-2xl font-bold">{stats.activeToday}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">نشط اليوم</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span className="text-2xl font-bold">{stats.activeThisWeek}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">نشط هذا الأسبوع</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-purple-500" />
            <span className="text-2xl font-bold">{stats.newSubscriptionsThisWeek}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">اشتراكات جديدة</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-red-500" />
            <span className="text-2xl font-bold">{stats.expiringSubscriptions}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">تنتهي خلال 7 أيام</p>
        </Card>
      </div>

      <Tabs defaultValue="distribution" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="distribution">توزيع الخطط</TabsTrigger>
          <TabsTrigger value="levels">المستويات</TabsTrigger>
          <TabsTrigger value="regions">المناطق</TabsTrigger>
          <TabsTrigger value="top">الأوائل</TabsTrigger>
        </TabsList>

        {/* Plan Distribution */}
        <TabsContent value="distribution">
          <Card className="p-4">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              توزيع الخطط
            </h4>
            <div className="space-y-3">
              {stats.planDistribution.map((item) => {
                const total = stats.planDistribution.reduce((sum, p) => sum + p._count.id, 0)
                const percentage = Math.round((item._count.id / total) * 100)
                return (
                  <div key={item.plan} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded ${planColors[item.plan] || 'bg-gray-500'}`} />
                        {planLabels[item.plan] || item.plan}
                      </span>
                      <span>{item._count.id} ({percentage}%)</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${planColors[item.plan] || 'bg-gray-500'} transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </TabsContent>

        {/* Users by Level */}
        <TabsContent value="levels">
          <Card className="p-4">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              المستوى الدراسي
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stats.usersByLevel.map((item) => (
                <div key={item.level} className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-2xl font-bold">{item._count.id}</p>
                  <p className="text-sm text-gray-500">{levelLabels[item.level] || item.level}</p>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Users by Region */}
        <TabsContent value="regions">
          <Card className="p-4">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              التوزيع الجغرافي
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stats.usersByGovernorate.slice(0, 12).map((item) => (
                <div key={item.governorate} className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-xl font-bold">{item._count.id}</p>
                  <p className="text-xs text-gray-500">{governorateLabels[item.governorate] || item.governorate}</p>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Top Users */}
        <TabsContent value="top">
          <Card className="p-4">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Star className="w-4 h-4" />
              أكبر 10 مستخدمين بالنقاط
            </h4>
            <div className="space-y-2">
              {stats.topUsers.map((user, index) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-700' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{user.name || user.email}</p>
                      <p className="text-xs text-gray-500">
                        🔥 {user.streak} يوم متتالي
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-purple-600">{user.points}</p>
                    <p className="text-xs text-gray-500">نقطة</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t flex justify-around text-center">
              <div>
                <p className="text-xl font-bold">{stats.totalPoints.toLocaleString()}</p>
                <p className="text-xs text-gray-500">إجمالي النقاط</p>
              </div>
              <div>
                <p className="text-xl font-bold">{stats.avgPoints}</p>
                <p className="text-xs text-gray-500">متوسط النقاط</p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
