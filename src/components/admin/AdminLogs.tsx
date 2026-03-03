'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, RefreshCw, Loader2, Clock, Activity } from 'lucide-react'

interface LogItem {
  id: string
  userId: string
  userName: string | null
  userEmail: string | null
  action: string
  details: string | null
  createdAt: string
}

export default function AdminLogs() {
  const [logs, setLogs] = useState<LogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [actionFilter, setActionFilter] = useState('')

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '30',
        ...(actionFilter && { action: actionFilter })
      })
      
      const res = await fetch(`/api/admin?action=logs&${params}`, { credentials: 'include' })
      const data = await res.json()
      
      if (data.success && Array.isArray(data.logs)) {
        setLogs(data.logs)
        setTotalPages(data.pagination?.totalPages || 1)
      } else {
        setLogs([])
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, actionFilter])

  const getActionColor = (action: string) => {
    if (!action) return 'text-gray-500'
    if (action.includes('ban')) return 'text-red-500'
    if (action.includes('create')) return 'text-green-500'
    if (action.includes('delete')) return 'text-red-500'
    if (action.includes('upgrade')) return 'text-purple-500'
    return 'text-gray-500'
  }

  const getActionLabel = (action: string) => {
    if (!action) return 'غير معروف'
    const labels: Record<string, string> = {
      'create-promo': 'إنشاء كود',
      'delete-promo': 'حذف كود',
      'ban-user': 'حظر مستخدم',
      'unban-user': 'إلغاء حظر',
      'upgrade-subscription': 'ترقية اشتراك',
      'cancel-subscription': 'إلغاء اشتراك',
      'extend-subscription': 'تمديد اشتراك'
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
        <Button onClick={fetchLogs} variant="outline" size="sm" className="gap-2" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>

      <Card className="p-3">
        <select 
          value={actionFilter} 
          onChange={(e) => setActionFilter(e.target.value)}
          className="w-full p-2 border rounded-lg bg-background"
        >
          <option value="">الكل</option>
          <option value="ban">الحظر</option>
          <option value="create">الإنشاء</option>
          <option value="delete">الحذف</option>
          <option value="subscription">الاشتراكات</option>
        </select>
      </Card>

      <Card className="p-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">لا توجد سجلات</div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 rounded-xl border gap-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 flex">
                    <Activity className={`w-4 h-4 ${getActionColor(log.action)}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={getActionColor(log.action)}>
                        {getActionLabel(log.action)}
                      </Badge>
                      {log.userName && <span className="text-sm font-medium">{log.userName}</span>}
                    </div>
                    {log.details && <p className="text-sm text-gray-500 truncate mt-0.5">{log.details}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {log.createdAt ? new Date(log.createdAt).toLocaleDateString('ar') : ''}
                </div>
              </div>
            ))}
          </div>
        )}

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
