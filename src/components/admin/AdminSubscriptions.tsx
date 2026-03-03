'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  Edit
} from 'lucide-react'

interface Subscription {
  id: string
  userId: string
  user: {
    name: string | null
    email: string
  }
  plan: string
  status: string
  endDate: string | null
  chatsUsed: number
  ocrUsed: number
}

interface AdminSubscriptionsProps {
  showMessage: (type: 'success' | 'error', message: string) => void
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

export default function AdminSubscriptions({ showMessage }: AdminSubscriptionsProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  
  // Dialog
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editPlan, setEditPlan] = useState('')
  const [extendDays, setExtendDays] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchSubscriptions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (planFilter) params.append('plan', planFilter)
      
      const res = await fetch(`/api/admin?action=subscriptions&${params}`, { credentials: 'include' })
      const data = await res.json()
      
      if (data.success && Array.isArray(data.subscriptions)) {
        setSubscriptions(data.subscriptions)
      } else {
        setSubscriptions([])
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setSubscriptions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscriptions()
  }, [statusFilter, planFilter])

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
        showMessage('success', 'تم تحديث الاشتراك')
        setShowEditDialog(false)
        fetchSubscriptions()
      } else {
        showMessage('error', data.error || 'فشل التحديث')
      }
    } catch {
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
        showMessage('success', `تم التمديد ${extendDays} يوم`)
        setExtendDays('')
        fetchSubscriptions()
      } else {
        showMessage('error', data.error || 'فشل التمديد')
      }
    } catch {
      showMessage('error', 'حدث خطأ')
    } finally {
      setActionLoading(false)
    }
  }

  const cancelSubscription = async () => {
    if (!selectedSub) return
    if (!confirm('هل أنت متأكد من إلغاء الاشتراك؟')) return
    
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'cancel-subscription',
          userId: selectedSub.userId,
          reason: 'إلغاء من الإدارة'
        })
      })
      const data = await res.json()
      
      if (data.success) {
        showMessage('success', 'تم إلغاء الاشتراك')
        setShowEditDialog(false)
        fetchSubscriptions()
      } else {
        showMessage('error', data.error || 'فشل الإلغاء')
      }
    } catch {
      showMessage('error', 'حدث خطأ')
    } finally {
      setActionLoading(false)
    }
  }

  const isExpiringSoon = (endDate: string | null) => {
    if (!endDate) return false
    const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days > 0 && days <= 7
  }

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
          <p className="text-2xl font-bold text-orange-500">{subscriptions.filter(s => isExpiringSoon(s.endDate)).length}</p>
          <p className="text-xs text-gray-500">تنتهي قريباً</p>
        </Card>
        <Card className="p-3">
          <p className="text-2xl font-bold text-red-500">{subscriptions.filter(s => s.status === 'EXPIRED').length}</p>
          <p className="text-xs text-gray-500">منتهية</p>
        </Card>
        <Card className="p-3">
          <p className="text-2xl font-bold text-purple-500">{subscriptions.filter(s => s.plan === 'PREMIUM' || s.plan === 'BAC_PRO').length}</p>
          <p className="text-xs text-gray-500">مميز</p>
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
              <div
                key={sub.id}
                className={`flex items-center justify-between p-3 rounded-xl border gap-2 ${isExpiringSoon(sub.endDate) ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/10' : ''}`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-full ${getPlanColor(sub.plan)} flex items-center justify-center text-white flex-shrink-0`}>
                    <Crown className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{sub.user?.name || sub.user?.email || 'مستخدم'}</p>
                      <Badge className={`${getPlanColor(sub.plan)} text-white text-xs`}>{getPlanLabel(sub.plan)}</Badge>
                      <Badge className={`${getStatusColor(sub.status)} text-white text-xs`}>{getStatusLabel(sub.status)}</Badge>
                      {isExpiringSoon(sub.endDate) && (
                        <Badge variant="destructive" className="text-xs"><AlertTriangle className="w-3 h-3 ml-1" />قريب</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{sub.endDate ? new Date(sub.endDate).toLocaleDateString('ar') : 'غير محدد'}</span>
                      <span>محادثات: {sub.chatsUsed || 0}</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => {
                  setSelectedSub(sub)
                  setEditPlan(sub.plan)
                  setShowEditDialog(true)
                }}>
                  <Edit className="w-4 h-4 ml-1" />
                  تعديل
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>تعديل الاشتراك</DialogTitle></DialogHeader>
          {selectedSub && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className={`w-10 h-10 rounded-full ${getPlanColor(selectedSub.plan)} flex items-center justify-center text-white`}>
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">{selectedSub.user?.name || selectedSub.user?.email || 'مستخدم'}</p>
                  <p className="text-sm text-gray-500">{getPlanLabel(selectedSub.plan)} - {getStatusLabel(selectedSub.status)}</p>
                </div>
              </div>
              
              <div>
                <Label>الخطة</Label>
                <Select value={editPlan} onValueChange={setEditPlan}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FREE">مجاني</SelectItem>
                    <SelectItem value="BASIC">أساسي</SelectItem>
                    <SelectItem value="PREMIUM">متقدم</SelectItem>
                    <SelectItem value="BAC_PRO">باك برو</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>تمديد (أيام)</Label>
                <div className="flex gap-2">
                  <Input type="number" value={extendDays} onChange={(e) => setExtendDays(e.target.value)} placeholder="عدد الأيام" />
                  <Button onClick={extendSubscription} disabled={!extendDays || actionLoading}>تمديد</Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="destructive" onClick={cancelSubscription} disabled={actionLoading}>إلغاء الاشتراك</Button>
            <Button onClick={updateSubscription} disabled={actionLoading} className="bg-purple-600 hover:bg-purple-700">
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
