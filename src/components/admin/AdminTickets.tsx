'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Ticket, RefreshCw, Loader2, AlertTriangle, User, Bot } from 'lucide-react'

interface TicketItem {
  id: string
  title: string
  category: string
  status: string
  priority: string
  needsHumanIntervention: boolean
  createdAt: string
  user: { name: string | null; email: string }
  messages?: Array<{
    id: string
    content: string
    isFromAI: boolean
    isFromAdmin: boolean
    createdAt: string
  }>
}

interface AdminTicketsProps {
  showMessage: (type: 'success' | 'error', message: string) => void
}

const statusLabels: Record<string, string> = {
  OPEN: 'مفتوحة',
  IN_PROGRESS: 'قيد المعالجة',
  WAITING_USER: 'بانتظار رد',
  RESOLVED: 'تم الحل',
  CLOSED: 'مغلقة'
}

const statusColors: Record<string, string> = {
  OPEN: 'bg-blue-500',
  IN_PROGRESS: 'bg-yellow-500',
  WAITING_USER: 'bg-orange-500',
  RESOLVED: 'bg-green-500',
  CLOSED: 'bg-gray-500'
}

export default function AdminTickets({ showMessage }: AdminTicketsProps) {
  const [tickets, setTickets] = useState<TicketItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null)

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter)
      
      const res = await fetch(`/api/admin/tickets?${params}`, { credentials: 'include' })
      const data = await res.json()
      setTickets(data.success && Array.isArray(data.tickets) ? data.tickets : [])
    } catch (err) {
      console.error('Error fetching tickets:', err)
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  const getStatusLabel = (status: string) => statusLabels[status] || status
  const getStatusColor = (status: string) => statusColors[status] || 'bg-gray-500'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Ticket className="w-5 h-5 text-orange-500" />
          تذاكر الدعم
        </h3>
        <Button onClick={fetchTickets} variant="outline" size="sm" className="gap-2" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3">
          <p className="text-2xl font-bold text-blue-500">{tickets.filter(t => t.status === 'OPEN').length}</p>
          <p className="text-xs text-gray-500">مفتوحة</p>
        </Card>
        <Card className="p-3">
          <p className="text-2xl font-bold text-orange-500">{tickets.filter(t => t.needsHumanIntervention).length}</p>
          <p className="text-xs text-gray-500">تحتاج تدخل</p>
        </Card>
        <Card className="p-3">
          <p className="text-2xl font-bold text-yellow-500">{tickets.filter(t => t.status === 'IN_PROGRESS').length}</p>
          <p className="text-xs text-gray-500">قيد المعالجة</p>
        </Card>
        <Card className="p-3">
          <p className="text-2xl font-bold text-green-500">{tickets.filter(t => t.status === 'RESOLVED').length}</p>
          <p className="text-xs text-gray-500">تم الحل</p>
        </Card>
      </div>

      {/* Filter */}
      <Card className="p-3">
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full p-2 border rounded-lg bg-background"
        >
          <option value="all">الكل</option>
          <option value="OPEN">مفتوحة</option>
          <option value="IN_PROGRESS">قيد المعالجة</option>
          <option value="WAITING_USER">بانتظار رد</option>
          <option value="RESOLVED">تم الحل</option>
          <option value="CLOSED">مغلقة</option>
        </select>
      </Card>

      {/* List */}
      <Card className="p-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">لا توجد تذاكر</div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {tickets.map((ticket) => (
              <div 
                key={ticket.id} 
                onClick={() => setSelectedTicket(selectedTicket?.id === ticket.id ? null : ticket)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedTicket?.id === ticket.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{ticket.title || 'بدون عنوان'}</p>
                    <p className="text-xs text-gray-500">{ticket.user?.name || ticket.user?.email || 'مستخدم'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {ticket.needsHumanIntervention && (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`px-2 py-1 text-xs rounded-full text-white ${getStatusColor(ticket.status)}`}>
                      {getStatusLabel(ticket.status)}
                    </span>
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
