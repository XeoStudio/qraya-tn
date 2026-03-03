'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, RefreshCw, Loader2, Users, Crown, MapPin, Star, Activity, Target } from 'lucide-react'

interface AdvancedStatsData {
  activeToday: number
  activeThisWeek: number
  newSubscriptionsThisWeek: number
  expiringSubscriptions: number
  totalPoints: number
  avgPoints: number
  topUsers: Array<{ id: string; name: string | null; email: string; points: number; streak: number }>
  usersByLevel: Array<{ level: string; _count: { id: number } }>
  usersByGovernorate: Array<{ governorate: string; _count: { id: number } }>
  planDistribution: Array<{ plan: string; _count: { id: number } }>
}

const planLabels: Record<string, string> = { FREE: 'مجاني', BASIC: 'أساسي', PREMIUM: 'متقدم', BAC_PRO: 'باك برو' }
const planColors: Record<string, string> = { FREE: 'bg-gray-500', BASIC: 'bg-blue-500', PREMIUM: 'bg-purple-500', BAC_PRO: 'bg-amber-500' }
const levelLabels: Record<string, string> = { primary: 'ابتدائي', preparatory: 'إعدادي', secondary: 'ثانوي', bac: 'باكالوريا' }
const govLabels: Record<string, string> = { tunis: 'تونس', ariana: 'أريانة', ben_arous: 'بن عروس', manouba: 'منوبة', sfax: 'صفاقس', sousse: 'سوسة', nabeul: 'نابل' }

export default function AdminAdvancedStats() {
  const [stats, setStats] = useState<AdvancedStatsData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin?action=advanced-stats', { credentials: 'include' })
      const data = await res.json()
      if (data.success) {
        setStats(data.advancedStats)
      } else {
        setStats(null)
      }
    } catch {
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

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
        <p className="text-gray-500 mb-4">لا توجد بيانات</p>
        <Button onClick={fetchStats} variant="outline">إعادة المحاولة</Button>
      </Card>
    )
  }

  const totalPlans = (stats.planDistribution || []).reduce((sum: number, p) => sum + (p._count?.id || 0), 0)

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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-500" />
            <span className="text-2xl font-bold">{stats.activeToday || 0}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">نشط اليوم</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span className="text-2xl font-bold">{stats.activeThisWeek || 0}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">نشط الأسبوع</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-purple-500" />
            <span className="text-2xl font-bold">{stats.newSubscriptionsThisWeek || 0}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">اشتراكات جديدة</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-red-500" />
            <span className="text-2xl font-bold">{stats.expiringSubscriptions || 0}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">تنتهي 7 أيام</p>
        </Card>
      </div>

      {/* Plan Distribution */}
      <Card className="p-4">
        <h4 className="font-semibold mb-4">توزيع الخطط</h4>
        <div className="space-y-3">
          {(stats.planDistribution || []).map((item) => {
            const count = item._count?.id || 0
            const pct = totalPlans > 0 ? Math.round((count / totalPlans) * 100) : 0
            return (
              <div key={item.plan || 'unknown'} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded ${planColors[item.plan] || 'bg-gray-500'}`} />
                    {planLabels[item.plan] || item.plan || 'غير محدد'}
                  </span>
                  <span>{count} ({pct}%)</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full ${planColors[item.plan] || 'bg-gray-500'}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Users by Level */}
      <Card className="p-4">
        <h4 className="font-semibold mb-4">المستوى الدراسي</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(stats.usersByLevel || []).map((item) => (
            <div key={item.level || 'unknown'} className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <p className="text-2xl font-bold">{item._count?.id || 0}</p>
              <p className="text-sm text-gray-500">{levelLabels[item.level] || item.level || 'غير محدد'}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Top Users */}
      <Card className="p-4">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Star className="w-4 h-4" />
          أكبر 5 مستخدمين
        </h4>
        <div className="space-y-2">
          {(stats.topUsers || []).slice(0, 5).map((user, i) => (
            <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-700' : 'bg-blue-500'}`}>
                  {i + 1}
                </div>
                <div>
                  <p className="font-medium">{user.name || user.email || 'مستخدم'}</p>
                  <p className="text-xs text-gray-500">🔥 {user.streak || 0} يوم</p>
                </div>
              </div>
              <div>
                <p className="font-bold text-purple-600">{user.points || 0}</p>
                <p className="text-xs text-gray-500">نقطة</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t flex justify-around text-center">
          <div>
            <p className="text-xl font-bold">{(stats.totalPoints || 0).toLocaleString()}</p>
            <p className="text-xs text-gray-500">إجمالي النقاط</p>
          </div>
          <div>
            <p className="text-xl font-bold">{stats.avgPoints || 0}</p>
            <p className="text-xs text-gray-500">متوسط النقاط</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
