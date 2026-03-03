'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, RefreshCw, Loader2, Crown, Clock, AlertTriangle, Edit } from 'lucide-react'

interface Subscription {
  id: string
  userId: string
  user: { name: string | null; email: string }
  plan: string
  status: string
  endDate: string | null
  chatsUsed: number
  ocrUsed: number
}

interface AdminSubscriptionsProps {
  showMessage: (type: 'success' | 'error', message: string) => void
}

const planLabels: Record<string, string> = { FREE: 'مجاني', BASIC: 'أساسي', PREMIUM: 'متقدم', BAC_PRO: 'باك برو' }
const planColors: Record<string, string> = { FREE: 'bg-gray-500', BASIC: 'bg-blue-500', PREMIUM: 'bg-purple-500', BAC_PRO: 'bg-amber-500' }
const statusLabels: Record<string, string> = { ACTIVE: 'نشط', EXPIRED: 'منتهي', CANCELLED: 'ملغي' }
const statusColors: Record<string, string> = { ACTIVE: 'bg-green-500', EXPIRED: 'bg-red-500', CANCELLED: 'bg-gray-500' }

export default function AdminSubscriptions({ showMessage }: AdminSubscriptionsProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  const fetchSubscriptions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      
      const res = await fetch(`/api/admin?action=subscriptions&${params}`, { credentials: 'include' })
      const data = await res.json()
      
      if (data.success && Array.isArray(data.subscriptions)) {
        setSubscriptions(data.subscriptions)
      } else {
        setSubscriptions([])
      }
    } catch {
      setSubscriptions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscriptions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  const getPlanLabel = (plan: string) => planLabels[plan] || plan
  const getPlanColor = (plan: string) => planColors[plan] || 'bg-gray-500'
  const getStatusLabel = (status: string) => statusLabels[status] || status
  const getStatusColor = (status: string) => statusColors[status] || 'bg-gray-500'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-amber-500" />
          إدارة الاشتراكات
        </h3>
        <Button onClick={fetchSubscriptions} variant="outline" size="sm" className="gap-2" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3">
          <p className="text-2xl font-bold text-green-500">{subscriptions.filter(s => s.status === 'ACTIVE').length}</p>
          <p className="text-xs text-gray-500">نشطة</p>
        </Card>
        <Card className="p-3">
          <p className="text-2xl font-bold text-red-500">{subscriptions.filter(s => s.status === 'EXPIRED').length}</p>
          <p className="text-xs text-gray-500">منتهية</p>
        </Card>
        <Card className="p-3">
          <p className="text-2xl font-bold text-purple-500">{subscriptions.filter(s => s.plan === 'PREMIUM' || s.plan === 'BAC_PRO').length}</p>
          <p className="text-xs text-gray-500">مميز</p>
        </Card>
        <Card className="p-3">
          <p className="text-2xl font-bold text-gray-500">{subscriptions.length}</p>
          <p className="text-xs text-gray-500">الإجمالي</p>
        </Card>
      </div>

      {/* Filter */}
      <Card className="p-3">
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full p-2 border rounded-lg bg-background"
        >
          <option value="">الكل</option>
          <option value="ACTIVE">نشط</option>
          <option value="EXPIRED">منتهي</option>
          <option value="CANCELLED">ملغي</option>
        </select>
      </Card>

      {/* List */}
      <Card className="p-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">لا توجد اشتراكات</div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl border gap-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-full ${getPlanColor(sub.plan)} flex items-center justify-center text-white flex-shrink-0`}>
                    <Crown className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{sub.user?.name || sub.user?.email || 'مستخدم'}</p>
                      <Badge className={`${getPlanColor(sub.plan)} text-white text-xs`}>{getPlanLabel(sub.plan)}</Badge>
                      <Badge className={`${getStatusColor(sub.status)} text-white text-xs`}>{getStatusLabel(sub.status)}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{sub.endDate ? new Date(sub.endDate).toLocaleDateString('ar') : 'غير محدد'}</span>
                      <span>محادثات: {sub.chatsUsed || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
