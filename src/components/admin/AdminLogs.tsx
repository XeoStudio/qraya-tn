'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  FileText, 
  RefreshCw, 
  Loader2,
  Search,
  Clock,
  User,
  Activity
} from 'lucide-react'

interface ActivityLog {
  id: string
  userId: string
  userName: string | null
  userEmail: string | null
  action: string
  details: string | null
  createdAt: string
}

export default function AdminLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [actionFilter, setActionFilter] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchLogs()
  }, [page, actionFilter])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...(actionFilter && { action: actionFilter })
      })
      
      const res = await fetch(`/api/admin?action=logs&${params}`, { credentials: 'include' })
      const data = await res.json()
      if (data.success) {
        setLogs(data.logs)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionColor = (action: string) => {
    if (action.includes('ban')) return 'text-red-500'
    if (action.includes('create')) return 'text-green-500'
    if (action.includes('delete')) return 'text-red-500'
    if (action.includes('upgrade')) return 'text-purple-500'
    if (action.includes('admin')) return 'text-blue-500'
    return 'text-gray-500'
  }

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'create-promo': 'إنشاء كود',
      'delete-promo': 'حذف كود',
      'ban-user': 'حظر مستخدم',
      'unban-user': 'إلغاء حظر',
      'promote-user': 'تغيير رتبة',
      'create-admin': 'إنشاء مدير',
      'upgrade-subscription': 'ترقية اشتراك',
      'downgrade-subscription': 'تخفيض اشتراك',
      'extend-subscription': 'تمديد اشتراك',
      'cancel-subscription': 'إلغاء اشتراك',
      'admin-reply-ticket': 'رد على تذكرة',
      'close-ticket': 'إغلاق تذكرة',
      'accept-ticket-intervention': 'قبول تدخل'
    }
    return labels[action] || action
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-500" />
          سجلات النشاط
        </h3>
        <Button onClick={fetchLogs} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          تحديث
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="بحث..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="نوع الإجراء" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">الكل</SelectItem>
              <SelectItem value="ban">الحظر</SelectItem>
              <SelectItem value="create">الإنشاء</SelectItem>
              <SelectItem value="delete">الحذف</SelectItem>
              <SelectItem value="subscription">الاشتراكات</SelectItem>
              <SelectItem value="ticket">التذاكر</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Logs */}
      <Card className="p-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            لا توجد سجلات
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-xl border gap-2"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                      <Activity className={`w-4 h-4 ${getActionColor(log.action)}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={getActionColor(log.action)}>
                          {getActionLabel(log.action)}
                        </Badge>
                        {log.userName && (
                          <span className="text-sm font-medium">{log.userName}</span>
                        )}
                      </div>
                      {log.details && (
                        <p className="text-sm text-gray-500 truncate mt-0.5">{log.details}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    {new Date(log.createdAt).toLocaleString('ar')}
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
              السابق
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
              التالي
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
