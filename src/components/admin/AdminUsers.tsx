'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  RefreshCw, 
  Ban, 
  CheckCircle, 
  Crown,
  MoreVertical,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Star,
  Users
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface User {
  id: string
  email: string
  name: string | null
  role: string
  status: string
  levelName: string | null
  points: number
  plan: string
  chatsCount: number
  createdAt: string
}

interface AdminUsersProps {
  showMessage: (type: 'success' | 'error', message: string) => void
}

export default function AdminUsers({ showMessage }: AdminUsersProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Dialogs
  const [showBanDialog, setShowBanDialog] = useState(false)
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedUserName, setSelectedUserName] = useState<string>('')
  const [banReason, setBanReason] = useState('')
  const [upgradePlan, setUpgradePlan] = useState('PREMIUM')
  const [upgradeDuration, setUpgradeDuration] = useState('30')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search })
      })
      
      const res = await fetch(`/api/admin?action=users&${params}`, { credentials: 'include' })
      const data = await res.json()
      
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users)
        setTotalPages(data.pagination?.totalPages || 1)
      } else {
        setUsers([])
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page])

  const handleSearch = () => {
    setPage(1)
    fetchUsers()
  }

  const banUser = async () => {
    if (!selectedUserId || !banReason.trim()) return
    
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'ban-user',
          userId: selectedUserId,
          reason: banReason
        })
      })
      const data = await res.json()
      
      if (data.success) {
        showMessage('success', 'تم حظر المستخدم')
        setShowBanDialog(false)
        setBanReason('')
        fetchUsers()
      } else {
        showMessage('error', data.error || 'فشل الحظر')
      }
    } catch {
      showMessage('error', 'حدث خطأ')
    } finally {
      setActionLoading(false)
    }
  }

  const unbanUser = async (userId: string) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'unban-user',
          userId
        })
      })
      const data = await res.json()
      
      if (data.success) {
        showMessage('success', 'تم إلغاء الحظر')
        fetchUsers()
      } else {
        showMessage('error', data.error || 'فشل إلغاء الحظر')
      }
    } catch {
      showMessage('error', 'حدث خطأ')
    }
  }

  const upgradeSubscription = async () => {
    if (!selectedUserId) return
    
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'upgrade-subscription',
          userId: selectedUserId,
          plan: upgradePlan,
          duration: parseInt(upgradeDuration)
        })
      })
      const data = await res.json()
      
      if (data.success) {
        showMessage('success', 'تمت الترقية')
        setShowUpgradeDialog(false)
        fetchUsers()
      } else {
        showMessage('error', data.error || 'فشلت الترقية')
      }
    } catch {
      showMessage('error', 'حدث خطأ')
    } finally {
      setActionLoading(false)
    }
  }

  const getPlanLabel = (plan: string) => {
    const labels: Record<string, string> = { FREE: 'مجاني', BASIC: 'أساسي', PREMIUM: 'متقدم', BAC_PRO: 'باك برو' }
    return labels[plan] || plan
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = { ACTIVE: 'نشط', BANNED: 'محظور', INACTIVE: 'غير نشط' }
    return labels[status] || status
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = { USER: 'مستخدم', PREMIUM: 'مميز', ADMIN: 'مدير' }
    return labels[role] || role
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-500" />
          إدارة المستخدمين
        </h3>
        <Button onClick={fetchUsers} variant="outline" size="sm" className="gap-2" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>

      {/* Search */}
      <Card className="p-3">
        <div className="flex gap-2">
          <Input
            placeholder="بحث بالاسم أو البريد..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} size="icon" disabled={loading}>
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Users List */}
      <Card className="p-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">لا يوجد مستخدمين</div>
        ) : (
          <div className="space-y-2">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 rounded-xl border hover:bg-gray-50 dark:hover:bg-gray-800 gap-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{user.name || 'بدون اسم'}</p>
                      <Badge variant={user.status === 'ACTIVE' ? 'default' : 'destructive'} className="text-xs">
                        {getStatusLabel(user.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                      <span className="flex items-center gap-1"><Star className="w-3 h-3" />{user.points} نقطة</span>
                      <span>•</span>
                      <span>{getPlanLabel(user.plan)}</span>
                      <span>•</span>
                      <span>{user.chatsCount || 0} محادثة</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {user.status === 'BANNED' ? (
                    <Button variant="outline" size="sm" onClick={() => unbanUser(user.id)} className="text-green-600">
                      <CheckCircle className="w-4 h-4 ml-1" />
                      إلغاء الحظر
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" onClick={() => {
                        setSelectedUserId(user.id)
                        setSelectedUserName(user.name || user.email)
                        setShowUpgradeDialog(true)
                      }} className="text-purple-600">
                        <Crown className="w-4 h-4 ml-1" />
                        ترقية
                      </Button>
                      {user.role !== 'ADMIN' && (
                        <Button variant="outline" size="sm" onClick={() => {
                          setSelectedUserId(user.id)
                          setSelectedUserName(user.name || user.email)
                          setShowBanDialog(true)
                        }} className="text-red-600">
                          <Ban className="w-4 h-4 ml-1" />
                          حظر
                        </Button>
                      )}
                    </>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => showMessage('info', `${user.email} - ${getRoleLabel(user.role)}`)}>
                        <Eye className="w-4 h-4 ml-2" />
                        عرض التفاصيل
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-500">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        )}
      </Card>

      {/* Ban Dialog */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>حظر المستخدم</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">سيتم حظر: {selectedUserName}</p>
            <div>
              <Label>سبب الحظر</Label>
              <Textarea value={banReason} onChange={(e) => setBanReason(e.target.value)} placeholder="أدخل سبب الحظر..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanDialog(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={banUser} disabled={!banReason.trim() || actionLoading}>
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حظر'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>ترقية الاشتراك</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">ترقية: {selectedUserName}</p>
            <div>
              <Label>الخطة</Label>
              <Select value={upgradePlan} onValueChange={setUpgradePlan}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BASIC">أساسي</SelectItem>
                  <SelectItem value="PREMIUM">متقدم</SelectItem>
                  <SelectItem value="BAC_PRO">باك برو</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>المدة (أيام)</Label>
              <Input type="number" value={upgradeDuration} onChange={(e) => setUpgradeDuration(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>إلغاء</Button>
            <Button onClick={upgradeSubscription} disabled={actionLoading} className="bg-purple-600 hover:bg-purple-700">
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ترقية'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
