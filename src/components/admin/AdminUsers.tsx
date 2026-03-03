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
  Loader2,
  Star,
  Users
} from 'lucide-react'

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const banUser = async (userId: string, reason: string) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'ban-user', userId, reason })
      })
      const data = await res.json()
      
      if (data.success) {
        showMessage('success', 'تم حظر المستخدم')
        fetchUsers()
      } else {
        showMessage('error', data.error || 'فشل الحظر')
      }
    } catch {
      showMessage('error', 'حدث خطأ')
    }
  }

  const unbanUser = async (userId: string) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'unban-user', userId })
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

  const getPlanLabel = (plan: string) => {
    const labels: Record<string, string> = { FREE: 'مجاني', BASIC: 'أساسي', PREMIUM: 'متقدم', BAC_PRO: 'باك برو' }
    return labels[plan] || plan
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = { ACTIVE: 'نشط', BANNED: 'محظور', INACTIVE: 'غير نشط' }
    return labels[status] || status
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
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            className="flex-1"
          />
          <Button onClick={fetchUsers} size="icon" disabled={loading}>
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
                  ) : user.role !== 'ADMIN' && (
                    <Button variant="outline" size="sm" onClick={() => {
                      const reason = prompt('سبب الحظر:')
                      if (reason) banUser(user.id, reason)
                    }} className="text-red-600">
                      <Ban className="w-4 h-4 ml-1" />
                      حظر
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              السابق
            </Button>
            <span className="text-sm text-gray-500">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              التالي
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
