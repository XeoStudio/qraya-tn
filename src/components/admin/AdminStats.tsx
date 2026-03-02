'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Activity, 
  Crown, 
  Ban,
  MessageSquare,
  Ticket,
  CreditCard,
  TrendingUp,
  Clock,
  AlertTriangle,
  RefreshCw,
  UserCheck,
  UserX
} from 'lucide-react'

interface AdminStatsProps {
  stats: {
    totalUsers: number
    activeUsers: number
    premiumUsers: number
    bannedUsers: number
    totalChats: number
    totalPromoCodes: number
    activeSubscriptions: number
    recentSignups: number
    openTickets: number
    humanInterventionTickets: number
  } | null
  loading: boolean
  onRefresh: () => void
}

export default function AdminStats({ stats, loading, onRefresh }: AdminStatsProps) {
  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
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

  const statCards = [
    { label: 'إجمالي المستخدمين', value: stats.totalUsers, icon: Users, color: 'blue', trend: `+${stats.recentSignups} هذا الأسبوع` },
    { label: 'المستخدمين النشطين', value: stats.activeUsers, icon: UserCheck, color: 'green' },
    { label: 'المستخدمين المميزين', value: stats.premiumUsers, icon: Crown, color: 'purple' },
    { label: 'المستخدمين المحظورين', value: stats.bannedUsers, icon: UserX, color: 'red' },
    { label: 'إجمالي المحادثات', value: stats.totalChats, icon: MessageSquare, color: 'blue' },
    { label: 'الاشتراكات النشطة', value: stats.activeSubscriptions, icon: CreditCard, color: 'green' },
    { label: 'تذاكر مفتوحة', value: stats.openTickets, icon: Ticket, color: 'orange' },
    { label: 'تذاكر تحتاج تدخل', value: stats.humanInterventionTickets, icon: AlertTriangle, color: 'red', highlight: true },
  ]

  const colors: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    red: 'from-red-500 to-red-600',
    orange: 'from-orange-500 to-orange-600',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          نظرة عامة
        </h3>
        <Button onClick={onRefresh} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          تحديث
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {statCards.map((stat, index) => (
          <Card 
            key={index} 
            className={`p-4 relative overflow-hidden ${stat.highlight ? 'ring-2 ring-red-500 ring-offset-2' : ''}`}
          >
            <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${colors[stat.color]}`} />
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${colors[stat.color]} flex items-center justify-center text-white flex-shrink-0`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-gray-500 truncate">{stat.label}</p>
                {stat.trend && (
                  <p className="text-xs text-green-500 mt-0.5">{stat.trend}</p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="p-4">
        <h4 className="font-semibold mb-3">إجراءات سريعة</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Button variant="outline" className="justify-start gap-2">
            <Users className="w-4 h-4" />
            إدارة المستخدمين
          </Button>
          <Button variant="outline" className="justify-start gap-2">
            <Ticket className="w-4 h-4" />
            التذاكر المعلقة
          </Button>
          <Button variant="outline" className="justify-start gap-2">
            <CreditCard className="w-4 h-4" />
            الاشتراكات المنتهية
          </Button>
          <Button variant="outline" className="justify-start gap-2">
            <AlertTriangle className="w-4 h-4" />
            تقارير الأخطاء
          </Button>
        </div>
      </Card>
    </div>
  )
}
