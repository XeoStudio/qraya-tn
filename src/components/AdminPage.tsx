'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users, 
  Ticket, 
  FileText, 
  AlertTriangle,
  BarChart3,
  Loader2,
  Ban,
  CheckCircle,
  Crown,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Settings,
  Shield,
  Database,
  Activity,
  RefreshCw,
  Download,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Eye,
  Mail,
  Clock,
  TrendingUp,
  UserCheck,
  UserX
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

interface AdminStats {
  totalUsers: number
  activeUsers: number
  premiumUsers: number
  bannedUsers: number
  totalChats: number
  totalPromoCodes: number
  activeSubscriptions: number
  recentSignups: number
}

interface AdminUser {
  id: string
  email: string
  name: string | null
  role: string
  status: string
  level: string | null
  levelName: string | null
  points: number
  plan: string
  chatsCount: number
  createdAt: string
  lastActive: string | null
  bannedAt: string | null
  bannedReason: string | null
}

interface PromoCode {
  id: string
  code: string
  planType: string
  duration: number | null
  maxUses: number | null
  usedCount: number
  isActive: boolean
  createdAt: string
}

interface ActivityLog {
  id: string
  userId: string
  userName: string | null
  userEmail: string | null
  action: string
  details: string | null
  createdAt: string
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('stats')
  const [loading, setLoading] = useState(false)
  
  // Messages
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  // Stats
  const [stats, setStats] = useState<AdminStats | null>(null)
  
  // Users
  const [users, setUsers] = useState<AdminUser[]>([])
  const [usersPage, setUsersPage] = useState(1)
  const [usersSearch, setUsersSearch] = useState('')
  
  // Promo Codes
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [newPromoCode, setNewPromoCode] = useState('')
  const [newPromoPlan, setNewPromoPlan] = useState('BASIC')
  const [newPromoDuration, setNewPromoDuration] = useState('')
  const [newPromoMaxUses, setNewPromoMaxUses] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  
  // Logs
  const [logs, setLogs] = useState<ActivityLog[]>([])
  
  // Selected user for actions
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [banReason, setBanReason] = useState('')

  // Auto-hide messages
  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg(null)
        setErrorMsg(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [successMsg, errorMsg])

  useEffect(() => {
    if (activeTab === 'stats') fetchStats()
    if (activeTab === 'users') fetchUsers()
    if (activeTab === 'promocodes') fetchPromoCodes()
    if (activeTab === 'logs') fetchLogs()
  }, [activeTab, usersPage])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin?action=stats', { credentials: 'include' })
      const data = await res.json()
      if (data.success) setStats(data.stats)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: usersPage.toString(), search: usersSearch })
      const res = await fetch(`/api/admin?action=users&${params}`, { credentials: 'include' })
      const data = await res.json()
      if (data.success) setUsers(data.users)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPromoCodes = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin?action=promocodes', { credentials: 'include' })
      const data = await res.json()
      if (data.success) setPromoCodes(data.promoCodes)
    } catch (error) {
      console.error('Failed to fetch promo codes:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin?action=logs', { credentials: 'include' })
      const data = await res.json()
      if (data.success) setLogs(data.logs)
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const createPromoCode = async () => {
    if (!newPromoCode) {
      setErrorMsg('الرجاء إدخال الكود')
      return
    }
    
    setPromoLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)
    
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-promo',
          code: newPromoCode.toUpperCase(),
          planType: newPromoPlan,
          duration: newPromoDuration ? parseInt(newPromoDuration) : null,
          maxUses: newPromoMaxUses ? parseInt(newPromoMaxUses) : null,
          agentMode: newPromoPlan === 'PREMIUM' || newPromoPlan === 'BAC_PRO',
          advancedAI: newPromoPlan === 'PREMIUM' || newPromoPlan === 'BAC_PRO',
          unlimitedChat: newPromoPlan === 'PREMIUM' || newPromoPlan === 'BAC_PRO',
          priority: newPromoPlan === 'PREMIUM' || newPromoPlan === 'BAC_PRO',
          exportPDF: newPromoPlan === 'PREMIUM' || newPromoPlan === 'BAC_PRO',
          ocrUnlimited: newPromoPlan === 'BAC_PRO',
          customPlans: newPromoPlan === 'BAC_PRO'
        }),
        credentials: 'include'
      })
      const data = await res.json()
      
      if (data.success) {
        setSuccessMsg(`تم إنشاء الكود ${newPromoCode.toUpperCase()} بنجاح!`)
        setNewPromoCode('')
        setNewPromoDuration('')
        setNewPromoMaxUses('')
        fetchPromoCodes()
      } else {
        setErrorMsg(data.error || 'فشل في إنشاء الكود')
      }
    } catch (error) {
      console.error('Failed to create promo code:', error)
      setErrorMsg('حدث خطأ في الاتصال')
    } finally {
      setPromoLoading(false)
    }
  }

  const banUser = async (userId: string) => {
    const reason = prompt('أدخل سبب الحظر:')
    if (!reason) return
    
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ban-user', userId, reason }),
        credentials: 'include'
      })
      const data = await res.json()
      
      if (data.success) {
        setSuccessMsg('تم حظر المستخدم بنجاح')
        fetchUsers()
      } else {
        setErrorMsg(data.error || 'فشل في حظر المستخدم')
      }
    } catch (error) {
      console.error('Failed to ban user:', error)
      setErrorMsg('حدث خطأ')
    }
  }

  const unbanUser = async (userId: string) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unban-user', userId }),
        credentials: 'include'
      })
      const data = await res.json()
      
      if (data.success) {
        setSuccessMsg('تم إلغاء حظر المستخدم')
        fetchUsers()
      } else {
        setErrorMsg('فشل في إلغاء الحظر')
      }
    } catch (error) {
      console.error('Failed to unban user:', error)
      setErrorMsg('حدث خطأ')
    }
  }

  const deletePromoCode = async (promoId: string, code: string) => {
    if (!confirm(`هل أنت متأكد من حذف الكود ${code}؟`)) return
    
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-promo', promoId }),
        credentials: 'include'
      })
      const data = await res.json()
      
      if (data.success) {
        setSuccessMsg('تم حذف الكود بنجاح')
        fetchPromoCodes()
      } else {
        setErrorMsg('فشل في حذف الكود')
      }
    } catch (error) {
      console.error('Failed to delete promo code:', error)
      setErrorMsg('حدث خطأ')
    }
  }

  const planLabels: Record<string, string> = {
    FREE: 'مجاني',
    BASIC: 'أساسي',
    PREMIUM: 'ممتاز',
    BAC_PRO: 'باك برو'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full px-2 sm:px-4"
    >
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
        <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
        لوحة التحكم
      </h2>

      {/* Messages */}
      {successMsg && (
        <Alert className="mb-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700 dark:text-green-300">{successMsg}</AlertDescription>
        </Alert>
      )}
      {errorMsg && (
        <Alert className="mb-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700 dark:text-red-300">{errorMsg}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-4 sm:mb-6 h-auto">
          <TabsTrigger value="stats" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
            <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 sm:ml-2" />
            <span className="hidden sm:inline">نظرة عامة</span>
            <span className="sm:hidden">إحصائيات</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
            <Users className="w-3 h-3 sm:w-4 sm:h-4 sm:ml-2" />
            <span className="hidden sm:inline">المستخدمين</span>
            <span className="sm:hidden">مستخدمين</span>
          </TabsTrigger>
          <TabsTrigger value="promocodes" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
            <Ticket className="w-3 h-3 sm:w-4 sm:h-4 sm:ml-2" />
            <span className="hidden sm:inline">الأكواد</span>
            <span className="sm:hidden">أكواد</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
            <FileText className="w-3 h-3 sm:w-4 sm:h-4 sm:ml-2" />
            <span className="hidden sm:inline">السجلات</span>
            <span className="sm:hidden">سجلات</span>
          </TabsTrigger>
        </TabsList>

        {/* Stats Tab */}
        <TabsContent value="stats">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
              <StatCard label="إجمالي المستخدمين" value={stats.totalUsers} icon={<Users />} color="blue" />
              <StatCard label="المستخدمين النشطين" value={stats.activeUsers} icon={<UserCheck />} color="green" />
              <StatCard label="المستخدمين المميزين" value={stats.premiumUsers} icon={<Crown />} color="purple" />
              <StatCard label="المستخدمين المحظورين" value={stats.bannedUsers} icon={<UserX />} color="red" />
              <StatCard label="إجمالي المحادثات" value={stats.totalChats} icon={<Activity />} color="blue" />
              <StatCard label="الاشتراكات النشطة" value={stats.activeSubscriptions} icon={<Ticket />} color="green" />
              <StatCard label="التسجيلات الأخيرة" value={stats.recentSignups} icon={<TrendingUp />} color="orange" />
              <StatCard label="أكواد التفعيل" value={stats.totalPromoCodes} icon={<Ticket />} color="purple" />
            </div>
          ) : (
            <div className="text-center p-8 text-gray-500">لا توجد بيانات</div>
          )}
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card className="p-2 sm:p-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4">
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder="بحث بالاسم أو البريد..."
                  value={usersSearch}
                  onChange={(e) => setUsersSearch(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                />
                <Button onClick={fetchUsers} size="icon">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              <Button onClick={fetchUsers} variant="outline" className="hidden sm:flex">
                <RefreshCw className="w-4 h-4 ml-2" />
                تحديث
              </Button>
            </div>

            <ScrollArea className="h-[400px] sm:h-[500px]">
              {users.length === 0 ? (
                <div className="text-center p-8 text-gray-500">لا يوجد مستخدمين</div>
              ) : (
                <div className="space-y-2">
                  {/* Mobile Card View */}
                  <div className="sm:hidden space-y-2">
                    {users.map((user) => (
                      <Card key={user.id} className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{user.name || '-'}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'} className="text-xs">
                                {user.role === 'ADMIN' ? 'مدير' : user.role === 'PREMIUM' ? 'مميز' : 'مستخدم'}
                              </Badge>
                              <Badge variant={user.status === 'ACTIVE' ? 'default' : 'destructive'} className="text-xs">
                                {user.status === 'ACTIVE' ? 'نشط' : 'محظور'}
                              </Badge>
                              <Badge variant="outline" className="text-xs">{planLabels[user.plan] || user.plan}</Badge>
                            </div>
                          </div>
                          {user.role !== 'ADMIN' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => user.status === 'ACTIVE' ? banUser(user.id) : unbanUser(user.id)}
                              className={user.status === 'ACTIVE' ? 'text-red-500' : 'text-green-500'}
                            >
                              {user.status === 'ACTIVE' ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                  
                  {/* Desktop Table View */}
                  <Table className="hidden sm:table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>المستخدم</TableHead>
                        <TableHead>الدور</TableHead>
                        <TableHead>الخطة</TableHead>
                        <TableHead>النقاط</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{user.name || '-'}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                              {user.role === 'ADMIN' ? 'مدير' : user.role === 'PREMIUM' ? 'مميز' : 'مستخدم'}
                            </Badge>
                          </TableCell>
                          <TableCell>{planLabels[user.plan] || user.plan}</TableCell>
                          <TableCell>{user.points}</TableCell>
                          <TableCell>
                            <Badge variant={user.status === 'ACTIVE' ? 'default' : 'destructive'}>
                              {user.status === 'ACTIVE' ? 'نشط' : 'محظور'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.role !== 'ADMIN' && (
                              user.status === 'ACTIVE' ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => banUser(user.id)}
                                  className="text-red-500 hover:bg-red-50"
                                >
                                  <Ban className="w-4 h-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => unbanUser(user.id)}
                                  className="text-green-500 hover:bg-green-50"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              )
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </ScrollArea>
          </Card>
        </TabsContent>

        {/* Promo Codes Tab */}
        <TabsContent value="promocodes">
          <Card className="p-2 sm:p-4">
            <h3 className="font-semibold mb-4 text-sm sm:text-base">إنشاء كود جديد</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4 mb-6">
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs sm:text-sm">الكود</Label>
                <Input
                  value={newPromoCode}
                  onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                  placeholder="TUNISIA2025"
                  className="font-mono text-sm"
                />
              </div>
              <div>
                <Label className="text-xs sm:text-sm">الخطة</Label>
                <Select value={newPromoPlan} onValueChange={setNewPromoPlan}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BASIC">أساسي</SelectItem>
                    <SelectItem value="PREMIUM">ممتاز</SelectItem>
                    <SelectItem value="BAC_PRO">باك برو</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs sm:text-sm">المدة (أيام)</Label>
                <Input
                  value={newPromoDuration}
                  onChange={(e) => setNewPromoDuration(e.target.value)}
                  placeholder="فارغ = دائم"
                  type="number"
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-xs sm:text-sm">الحد الأقصى</Label>
                <Input
                  value={newPromoMaxUses}
                  onChange={(e) => setNewPromoMaxUses(e.target.value)}
                  placeholder="غير محدود"
                  type="number"
                  className="text-sm"
                />
              </div>
            </div>
            <Button onClick={createPromoCode} disabled={promoLoading || !newPromoCode} className="mb-6 w-full sm:w-auto">
              {promoLoading ? (
                <><Loader2 className="w-4 h-4 ml-2 animate-spin" />جاري الإنشاء...</>
              ) : (
                <><Plus className="w-4 h-4 ml-2" />إنشاء كود</>
              )}
            </Button>

            <h3 className="font-semibold mb-4 text-sm sm:text-base">الأكواد الموجودة</h3>
            <ScrollArea className="h-[250px] sm:h-[300px]">
              {promoCodes.length === 0 ? (
                <div className="text-center p-8 text-gray-500">لا توجد أكواد</div>
              ) : (
                <div className="space-y-2">
                  {/* Mobile Card View */}
                  <div className="sm:hidden space-y-2">
                    {promoCodes.map((promo) => (
                      <Card key={promo.id} className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-mono font-bold">{promo.code}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <Badge variant="outline" className="text-xs">{planLabels[promo.planType]}</Badge>
                              <Badge variant={promo.isActive ? 'default' : 'secondary'} className="text-xs">
                                {promo.isActive ? 'نشط' : 'معطل'}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              الاستخدام: {promo.usedCount} / {promo.maxUses || '∞'}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deletePromoCode(promo.id, promo.code)}
                            className="text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                  
                  {/* Desktop Table View */}
                  <Table className="hidden sm:table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>الكود</TableHead>
                        <TableHead>الخطة</TableHead>
                        <TableHead>الاستخدام</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {promoCodes.map((promo) => (
                        <TableRow key={promo.id}>
                          <TableCell className="font-mono font-bold">{promo.code}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{planLabels[promo.planType]}</Badge>
                          </TableCell>
                          <TableCell>
                            {promo.usedCount} / {promo.maxUses || '∞'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={promo.isActive ? 'default' : 'secondary'}>
                              {promo.isActive ? 'نشط' : 'معطل'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deletePromoCode(promo.id, promo.code)}
                              className="text-red-500 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </ScrollArea>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <Card className="p-2 sm:p-4">
            <ScrollArea className="h-[400px] sm:h-[500px]">
              {logs.length === 0 ? (
                <div className="text-center p-8 text-gray-500">لا توجد سجلات</div>
              ) : (
                <div className="space-y-2">
                  {/* Mobile Card View */}
                  <div className="sm:hidden space-y-2">
                    {logs.map((log) => (
                      <Card key={log.id} className="p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">{log.userName || 'نظام'}</p>
                            <Badge variant="outline" className="text-xs mt-1">{log.action}</Badge>
                            <p className="text-xs text-gray-500 mt-1">{log.details}</p>
                          </div>
                          <p className="text-xs text-gray-400">
                            {new Date(log.createdAt).toLocaleDateString('ar-TN')}
                          </p>
                        </div>
                      </Card>
                    ))}
                  </div>
                  
                  {/* Desktop Table View */}
                  <Table className="hidden sm:table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>المستخدم</TableHead>
                        <TableHead>الإجراء</TableHead>
                        <TableHead>التفاصيل</TableHead>
                        <TableHead>التاريخ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{log.userName || '-'}</p>
                              <p className="text-sm text-gray-500">{log.userEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.action}</Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{log.details}</TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {new Date(log.createdAt).toLocaleString('ar-TN')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </ScrollArea>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}

function StatCard({ 
  label, 
  value, 
  icon, 
  color 
}: { 
  label: string
  value: number
  icon: React.ReactNode
  color: string
}) {
  const colors: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    red: 'from-red-500 to-red-600',
    orange: 'from-orange-500 to-orange-600'
  }

  return (
    <Card className="p-2 sm:p-4">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-r ${colors[color]} flex items-center justify-center text-white flex-shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-lg sm:text-2xl font-bold">{value}</p>
          <p className="text-xs sm:text-sm text-gray-500 truncate">{label}</p>
        </div>
      </div>
    </Card>
  )
}
