'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  CreditCard, 
  RefreshCw, 
  Loader2,
  Crown,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  TrendingUp,
  Edit
} from 'lucide-react'

interface Subscription {
  id: string
  userId: string
  user: {
    id: string
    name: string | null
    email: string
    level?: string | null
    levelName?: string | null
  }
  plan: string
  status: string
  startDate: string
  endDate: string | null
  features: {
    agentMode: boolean
    advancedAI: boolean
    unlimitedChat: boolean
    priority: boolean
    exportPDF: boolean
    ocrUnlimited: boolean
    customPlans: boolean
  }
  chatsUsed: number
  ocrUsed: number
  quotaLimit: number
  createdAt: string
}

interface AdminSubscriptionsProps {
  showMessage: (type: 'success' | 'error', message: string) => void
}

export default function AdminSubscriptions({ showMessage }: AdminSubscriptionsProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  
  // Dialogs
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  
  // Edit form
  const [editPlan, setEditPlan] = useState('')
  const [editEndDate, setEditEndDate] = useState('')
  const [extendDays, setExtendDays] = useState('')

  useEffect(() => {
    fetchSubscriptions()
  }, [statusFilter, planFilter])

  const fetchSubscriptions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        ...(statusFilter && { status: statusFilter }),
        ...(planFilter && { plan: planFilter })
      })
      
      const res = await fetch(`/api/admin?action=subscriptions&${params}`, { credentials: 'include' })
      const data = await res.json()
      if (data.success) {
        setSubscriptions(data.subscriptions)
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSubscription = async () => {
    if (!selectedSub) return
    
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'upgrade-subscription',
          userId: selectedSub.userId,
          plan: editPlan,
          duration: 30
        })
      })
      const data = await res.json()
      
      if (data.success) {
        showMessage('success', 'تم تحديث الاشتراك بنجاح')
        setShowEditDialog(false)
        fetchSubscriptions()
      } else {
        showMessage('error', data.error || 'فشل في تحديث الاشتراك')
      }
    } catch (error) {
      showMessage('error', 'حدث خطأ')
    } finally {
      setActionLoading(false)
    }
  }

  const extendSubscription = async () => {
    if (!selectedSub || !extendDays) return
    
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'extend-subscription',
          userId: selectedSub.userId,
          days: parseInt(extendDays)
        })
      })
      const data = await res.json()
      
      if (data.success) {
        showMessage('success', `تم تمديد الاشتراك ${extendDays} يوم`)
        setExtendDays('')
        fetchSubscriptions()
      } else {
        showMessage('error', data.error || 'فشل في تمديد الاشتراك')
      }
    } catch (error) {
      showMessage('error', 'حدث خطأ')
    } finally {
      setActionLoading(false)
    }
  }

  const cancelSubscription = async () => {
    if (!selectedSub) return
    if (!confirm('هل أنت متأكد من إلغاء هذا الاشتراك؟')) return
    
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'cancel-subscription',
          userId: selectedSub.userId,
          reason: 'إلغاء من قبل الإدارة'
        })
      })
      const data = await res.json()
      
      if (data.success) {
        showMessage('success', 'تم إلغاء الاشتراك')
        setShowEditDialog(false)
        fetchSubscriptions()
      } else {
        showMessage('error', data.error || 'فشل في إلغاء الاشتراك')
      }
    } catch (error) {
      showMessage('error', 'حدث خطأ')
    } finally {
      setActionLoading(false)
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

  const statusLabels: Record<string, string> = {
    ACTIVE: 'نشط',
    EXPIRED: 'منتهي',
    CANCELLED: 'ملغي'
  }

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-500',
    EXPIRED: 'bg-red-500',
    CANCELLED: 'bg-gray-500'
  }

  const isExpiringSoon = (endDate: string | null) => {
    if (!endDate) return false
    const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days > 0 && days <= 7
  }

  const isExpired = (endDate: string | null) => {
    if (!endDate) return false
    return new Date(endDate) < new Date()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-amber-500" />
          إدارة الاشتراكات
        </h3>
        <Button onClick={fetchSubscriptions} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          تحديث
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3">
          <p className="text-2xl font-bold text-green-500">
            {subscriptions.filter(s => s.status === 'ACTIVE').length}
          </p>
          <p className="text-xs text-gray-500">نشطة</p>
        </Card>
        <Card className="p-3">
          <p className="text-2xl font-bold text-red-500">
            {subscriptions.filter(s => isExpiringSoon(s.endDate)).length}
          </p>
          <p className="text-xs text-gray-500">تنتهي قريباً</p>
        </Card>
        <Card className="p-3">
          <p className="text-2xl font-bold text-gray-500">
            {subscriptions.filter(s => isExpired(s.endDate)).length}
          </p>
          <p className="text-xs text-gray-500">منتهية</p>
        </Card>
        <Card className="p-3">
          <p className="text-2xl font-bold text-purple-500">
            {subscriptions.filter(s => s.plan === 'PREMIUM' || s.plan === 'BAC_PRO').length}
          </p>
          <p className="text-xs text-gray-500">متقدم/باك برو</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-3">
        <div className="flex flex-wrap gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">الكل</SelectItem>
              <SelectItem value="ACTIVE">نشط</SelectItem>
              <SelectItem value="EXPIRED">منتهي</SelectItem>
              <SelectItem value="CANCELLED">ملغي</SelectItem>
            </SelectContent>
          </Select>
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="الخطة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">الكل</SelectItem>
              <SelectItem value="FREE">مجاني</SelectItem>
              <SelectItem value="BASIC">أساسي</SelectItem>
              <SelectItem value="PREMIUM">متقدم</SelectItem>
              <SelectItem value="BAC_PRO">باك برو</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Subscriptions List */}
      <Card className="p-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            لا توجد اشتراكات
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-xl border gap-2 ${
                    isExpiringSoon(sub.endDate) ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-full ${planColors[sub.plan]} flex items-center justify-center text-white flex-shrink-0`}>
                      <Crown className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{sub.user.name || sub.user.email}</p>
                        <Badge className={`${planColors[sub.plan]} text-white`}>
                          {planLabels[sub.plan]}
                        </Badge>
                        <Badge className={`${statusColors[sub.status]} text-white`}>
                          {statusLabels[sub.status]}
                        </Badge>
                        {isExpiringSoon(sub.endDate) && (
                          <Badge variant="destructive">
                            <AlertTriangle className="w-3 h-3 ml-1" />
                            ينتهي قريباً
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {sub.endDate ? new Date(sub.endDate).toLocaleDateString('ar') : 'غير محدد'}
                        </span>
                        <span>المحادثات: {sub.chatsUsed}</span>
                        <span>OCR: {sub.ocrUsed}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedSub(sub)
                      setEditPlan(sub.plan)
                      setEditEndDate(sub.endDate ? sub.endDate.split('T')[0] : '')
                      setShowEditDialog(true)
                    }}
                  >
                    <Edit className="w-4 h-4 ml-1" />
                    تعديل
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل الاشتراك</DialogTitle>
          </DialogHeader>
          {selectedSub && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className={`w-10 h-10 rounded-full ${planColors[selectedSub.plan]} flex items-center justify-center text-white`}>
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">{selectedSub.user.name || selectedSub.user.email}</p>
                  <p className="text-sm text-gray-500">
                    {planLabels[selectedSub.plan]} - {statusLabels[selectedSub.status]}
                  </p>
                </div>
              </div>
              
              <div>
                <Label>الخطة</Label>
                <Select value={editPlan} onValueChange={setEditPlan}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FREE">مجاني</SelectItem>
                    <SelectItem value="BASIC">أساسي</SelectItem>
                    <SelectItem value="PREMIUM">متقدم</SelectItem>
                    <SelectItem value="BAC_PRO">باك برو</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>تاريخ الانتهاء</Label>
                <Input
                  type="date"
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                />
              </div>
              
              <div>
                <Label>تمديد الاشتراك (أيام)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={extendDays}
                    onChange={(e) => setExtendDays(e.target.value)}
                    placeholder="عدد الأيام"
                  />
                  <Button onClick={extendSubscription} disabled={!extendDays || actionLoading}>
                    تمديد
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="destructive"
              onClick={cancelSubscription}
              disabled={actionLoading}
            >
              إلغاء الاشتراك
            </Button>
            <Button
              onClick={updateSubscription}
              disabled={actionLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ التغييرات'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
