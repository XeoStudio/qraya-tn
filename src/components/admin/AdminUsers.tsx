'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Search, 
  RefreshCw, 
  Ban, 
  CheckCircle, 
  Crown,
  MoreVertical,
  Eye,
  Edit,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Star,
  X,
  Users,
  AlertCircle
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface AdminUser {
  id: string
  email: string
  name: string | null
  role: string
  status: string
  level: string | null
  levelName: string | null
  points: number
  streak: number
  plan: string
  planStatus: string | null
  planEndDate: string | null
  chatsCount: number
  ticketsCount: number
  createdAt: string
  lastActive: string | null
  bannedAt: string | null
  bannedReason: string | null
  notes: string | null
}

interface AdminUsersProps {
  showMessage: (type: 'success' | 'error', message: string) => void
}

const planLabels: Record<string, string> = {
  FREE: 'مجاني',
  BASIC: 'أساسي',
  PREMIUM: 'متقدم',
  BAC_PRO: 'باك برو'
}

const roleLabels: Record<string, string> = {
  USER: 'مستخدم',
  PREMIUM: 'مميز',
  ADMIN: 'مدير'
}

const statusLabels: Record<string, string> = {
  ACTIVE: 'نشط',
  BANNED: 'محظور',
  INACTIVE: 'غير نشط'
}

export default function AdminUsers({ showMessage }: AdminUsersProps) {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Dialogs
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [showBanDialog, setShowBanDialog] = useState(false)
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [banReason, setBanReason] = useState('')
  const [notes, setNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  
  // Upgrade form
  const [upgradePlan, setUpgradePlan] = useState('PREMIUM')
  const [upgradeDuration, setUpgradeDuration] = useState('30')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { status: statusFilter })
      })
      
      const res = await fetch(`/api/admin?action=users&${params}`, { credentials: 'include' })
      
      if (!res.ok) {
        throw new Error('فشل في تحميل البيانات')
      }
      
      const data = await res.json()
      
      if (data.success) {
        setUsers(data.users || [])
        setTotalPages(data.pagination?.totalPages || 1)
      } else {
        throw new Error(data.error || 'حدث خطأ')
      }
    } catch (err) {
      console.error('Error fetching users:', err)
      setError(err instanceof Error ? err.message : 'حدث خطأ في تحميل المستخدمين')
    } finally {
      setLoading(false)
    }
  }, [page, search, roleFilter, statusFilter])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleSearch = () => {
    setPage(1)
    fetchUsers()
  }

  const banUser = async () => {
    if (!selectedUser || !banReason.trim()) return
    
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'ban-user',
          userId: selectedUser.id,
          reason: banReason
        })
      })
      const data = await res.json()
      
      if (data.success) {
        showMessage('success', 'تم حظر المستخدم بنجاح')
        setShowBanDialog(false)
        setBanReason('')
        fetchUsers()
      } else {
        showMessage('error', data.error || 'فشل في حظر المستخدم')
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
        showMessage('error', data.error || 'فشل في إلغاء الحظر')
      }
    } catch {
      showMessage('error', 'حدث خطأ')
    }
  }

  const upgradeSubscription = async () => {
    if (!selectedUser) return
    
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'upgrade-subscription',
          userId: selectedUser.id,
          plan: upgradePlan,
          duration: parseInt(upgradeDuration)
        })
      })
      const data = await res.json()
      
      if (data.success) {
        showMessage('success', `تم ترقية الاشتراك إلى ${planLabels[upgradePlan] || upgradePlan} لمدة ${upgradeDuration} يوم`)
        setShowUpgradeDialog(false)
        fetchUsers()
      } else {
        showMessage('error', data.error || 'فشل في ترقية الاشتراك')
      }
    } catch {
      showMessage('error', 'حدث خطأ')
    } finally {
      setActionLoading(false)
    }
  }

  const saveNotes = async () => {
    if (!selectedUser) return
    
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'add-user-notes',
          userId: selectedUser.id,
          notes
        })
      })
      const data = await res.json()
      
      if (data.success) {
        showMessage('success', 'تم حفظ الملاحظات')
        fetchUsers()
      } else {
        showMessage('error', 'فشل في حفظ الملاحظات')
      }
    } catch {
      showMessage('error', 'حدث خطأ')
    }
  }

  // Helper functions for safe label display
  const getRoleLabel = (role: string) => roleLabels[role] || role
  const getStatusLabel = (status: string) => statusLabels[status] || status
  const getPlanLabel = (plan: string) => planLabels[plan] || plan

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-500" />
          إدارة المستخدمين
        </h3>
        <Button onClick={fetchUsers} variant="outline" size="sm" className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button variant="ghost" size="sm" onClick={fetchUsers}>
              إعادة المحاولة
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card className="p-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 flex gap-2">
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
          <div className="flex gap-2 flex-wrap">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="الدور" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">الكل</SelectItem>
                <SelectItem value="USER">مستخدم</SelectItem>
                <SelectItem value="PREMIUM">مميز</SelectItem>
                <SelectItem value="ADMIN">مدير</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">الكل</SelectItem>
                <SelectItem value="ACTIVE">نشط</SelectItem>
                <SelectItem value="BANNED">محظور</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Users List */}
      <Card className="p-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            لا يوجد مستخدمين
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-xl border hover:bg-gray-50 dark:hover:bg-gray-800 gap-2"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{user.name || 'بدون اسم'}</p>
                        <div className="flex gap-1">
                          <Badge 
                            variant={user.role === 'ADMIN' ? 'default' : 'secondary'} 
                            className="text-xs"
                          >
                            {getRoleLabel(user.role)}
                          </Badge>
                          <Badge 
                            variant={user.status === 'ACTIVE' ? 'default' : 'destructive'} 
                            className="text-xs"
                          >
                            {getStatusLabel(user.status)}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          {user.points} نقطة
                        </span>
                        <span>•</span>
                        <span>{getPlanLabel(user.plan)}</span>
                        <span>•</span>
                        <span>{user.chatsCount || 0} محادثة</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {user.status === 'BANNED' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => unbanUser(user.id)}
                        className="flex-1 sm:flex-none text-green-600 hover:text-green-700"
                      >
                        <CheckCircle className="w-4 h-4 ml-1" />
                        إلغاء الحظر
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user)
                            setShowUpgradeDialog(true)
                          }}
                          className="flex-1 sm:flex-none text-purple-600"
                        >
                          <Crown className="w-4 h-4 ml-1" />
                          ترقية
                        </Button>
                        {user.role !== 'ADMIN' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user)
                              setShowBanDialog(true)
                            }}
                            className="flex-1 sm:flex-none text-red-600"
                          >
                            <Ban className="w-4 h-4 ml-1" />
                            حظر
                          </Button>
                        )}
                      </>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedUser(user)
                          setNotes(user.notes || '')
                          setShowUserDetails(true)
                        }}>
                          <Eye className="w-4 h-4 ml-2" />
                          عرض التفاصيل
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedUser(user)
                          setNotes(user.notes || '')
                          setShowUserDetails(true)
                        }}>
                          <Edit className="w-4 h-4 ml-2" />
                          إضافة ملاحظات
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-500">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        )}
      </Card>

      {/* User Details Dialog */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تفاصيل المستخدم</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                  {selectedUser.name?.charAt(0) || selectedUser.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{selectedUser.name || 'بدون اسم'}</p>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">الدور</p>
                  <p className="font-medium">{getRoleLabel(selectedUser.role)}</p>
                </div>
                <div>
                  <p className="text-gray-500">الحالة</p>
                  <p className="font-medium">{getStatusLabel(selectedUser.status)}</p>
                </div>
                <div>
                  <p className="text-gray-500">الخطة</p>
                  <p className="font-medium">{getPlanLabel(selectedUser.plan)}</p>
                </div>
                <div>
                  <p className="text-gray-500">النقاط</p>
                  <p className="font-medium">{selectedUser.points}</p>
                </div>
                <div>
                  <p className="text-gray-500">المحادثات</p>
                  <p className="font-medium">{selectedUser.chatsCount || 0}</p>
                </div>
                <div>
                  <p className="text-gray-500">التذاكر</p>
                  <p className="font-medium">{selectedUser.ticketsCount || 0}</p>
                </div>
              </div>
              
              <div>
                <Label>ملاحظات</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أضف ملاحظات خاصة بالمستخدم..."
                  rows={3}
                />
              </div>
              
              <Button onClick={saveNotes} className="w-full">
                حفظ الملاحظات
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Ban Dialog */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حظر المستخدم</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              سيتم حظر المستخدم {selectedUser?.name || selectedUser?.email} من استخدام المنصة.
            </p>
            <div>
              <Label>سبب الحظر</Label>
              <Textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="أدخل سبب الحظر..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanDialog(false)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={banUser}
              disabled={!banReason.trim() || actionLoading}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حظر'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ترقية الاشتراك</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              ترقية اشتراك {selectedUser?.name || selectedUser?.email}
            </p>
            <div>
              <Label>الخطة</Label>
              <Select value={upgradePlan} onValueChange={setUpgradePlan}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BASIC">أساسي</SelectItem>
                  <SelectItem value="PREMIUM">متقدم</SelectItem>
                  <SelectItem value="BAC_PRO">باك برو</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>المدة (بالأيام)</Label>
              <Input
                type="number"
                value={upgradeDuration}
                onChange={(e) => setUpgradeDuration(e.target.value)}
                placeholder="30"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
              إلغاء
            </Button>
            <Button
              onClick={upgradeSubscription}
              disabled={actionLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ترقية'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
