'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Ticket, RefreshCw, Loader2, MessageCircle, Bot, User, AlertTriangle, CheckCircle, Send } from 'lucide-react'

interface TicketMsg {
  id: string
  content: string
  isFromAI: boolean
  isFromAdmin: boolean
  createdAt: string
}

interface TicketItem {
  id: string
  title: string
  category: string
  status: string
  priority: string
  needsHumanIntervention: boolean
  createdAt: string
  user: { name: string | null; email: string }
  messages?: TicketMsg[]
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

const categoryLabels: Record<string, string> = {
  GENERAL: 'عام',
  TECHNICAL: 'تقني',
  BILLING: 'فواتير',
  SUGGESTION: 'اقتراح'
}

export default function AdminTickets({ showMessage }: AdminTicketsProps) {
  const [tickets, setTickets] = useState<TicketItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [replyMessage, setReplyMessage] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ status: statusFilter })
      const res = await fetch(`/api/admin/tickets?${params}`, { credentials: 'include' })
      
      if (!res.ok) {
        throw new Error('فشل في تحميل البيانات')
      }
      
      const data = await res.json()
      setTickets(data.success && Array.isArray(data.tickets) ? data.tickets : [])
    } catch (err) {
      console.error('Error fetching tickets:', err)
      setError('حدث خطأ في تحميل البيانات')
      setTickets([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const fetchTicketDetails = async (ticketId: string) => {
    setDetailsLoading(true)
    try {
      const res = await fetch('/api/admin/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'get-details', ticketId })
      })
      const data = await res.json()
      if (data.success && data.ticket) {
        setSelectedTicket(data.ticket)
      }
    } catch {
      console.error('Error fetching details')
    } finally {
      setDetailsLoading(false)
    }
  }

  const sendReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return
    
    setSendingReply(true)
    try {
      const res = await fetch('/api/admin/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'reply', ticketId: selectedTicket.id, message: replyMessage })
      })
      const data = await res.json()
      
      if (data.success) {
        showMessage('success', 'تم إرسال الرد')
        setReplyMessage('')
        fetchTicketDetails(selectedTicket.id)
      } else {
        showMessage('error', data.error || 'فشل الإرسال')
      }
    } catch {
      showMessage('error', 'حدث خطأ')
    } finally {
      setSendingReply(false)
    }
  }

  const closeTicket = async () => {
    if (!selectedTicket) return
    try {
      const res = await fetch('/api/admin/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'close', ticketId: selectedTicket.id })
      })
      const data = await res.json()
      if (data.success) {
        showMessage('success', 'تم إغلاق التذكرة')
        fetchTickets()
        fetchTicketDetails(selectedTicket.id)
      }
    } catch {
      showMessage('error', 'حدث خطأ')
    }
  }

  const getStatusLabel = (status: string) => statusLabels[status] || status
  const getStatusColor = (status: string) => statusColors[status] || 'bg-gray-500'
  const getCategoryLabel = (category: string) => categoryLabels[category] || category

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

      <Card className="p-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="OPEN">مفتوحة</SelectItem>
            <SelectItem value="IN_PROGRESS">قيد المعالجة</SelectItem>
            <SelectItem value="WAITING_USER">بانتظار رد</SelectItem>
            <SelectItem value="RESOLVED">تم الحل</SelectItem>
            <SelectItem value="CLOSED">مغلقة</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200">
          <p className="text-red-600 text-center">{error}</p>
          <Button onClick={fetchTickets} variant="outline" size="sm" className="mt-2 w-full">
            إعادة المحاولة
          </Button>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* List */}
        <Card className="lg:col-span-1 p-3">
          <h4 className="font-semibold mb-3">التذاكر ({tickets.length})</h4>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">لا توجد تذاكر</div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => { setSelectedTicket(ticket); fetchTicketDetails(ticket.id) }}
                  className={`w-full text-right p-3 rounded-xl border transition-all ${
                    selectedTicket?.id === ticket.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium truncate">{ticket.title || 'بدون عنوان'}</p>
                  <p className="text-xs text-gray-500 truncate">{ticket.user?.name || ticket.user?.email || 'مستخدم'}</p>
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-xs">{getCategoryLabel(ticket.category)}</Badge>
                    <Badge className={`${getStatusColor(ticket.status)} text-white text-xs`}>{getStatusLabel(ticket.status)}</Badge>
                    {ticket.needsHumanIntervention && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="w-3 h-3 ml-1" />تدخل
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Details */}
        <Card className="lg:col-span-2 p-3">
          {!selectedTicket ? (
            <div className="text-center py-12 text-gray-500">
              <Ticket className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>اختر تذكرة لعرض التفاصيل</p>
            </div>
          ) : detailsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="flex flex-col h-[550px]">
              <div className="pb-3 border-b mb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold">{selectedTicket.title || 'بدون عنوان'}</h4>
                    <p className="text-sm text-gray-500">{selectedTicket.user?.name || selectedTicket.user?.email || 'مستخدم'}</p>
                  </div>
                  {selectedTicket.status !== 'CLOSED' && (
                    <Button size="sm" variant="outline" onClick={closeTicket}>
                      <CheckCircle className="w-4 h-4 ml-1" />
                      إغلاق
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{getCategoryLabel(selectedTicket.category)}</Badge>
                  <Badge className={`${getStatusColor(selectedTicket.status)} text-white`}>{getStatusLabel(selectedTicket.status)}</Badge>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {(selectedTicket.messages || []).map((msg) => (
                  <div key={msg.id} className={`flex gap-2 ${msg.isFromAdmin ? '' : msg.isFromAI ? '' : 'flex-row-reverse'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.isFromAI ? 'bg-gradient-to-r from-purple-500 to-blue-500' : msg.isFromAdmin ? 'bg-green-500' : 'bg-blue-500'
                    }`}>
                      {msg.isFromAI ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
                    </div>
                    <div className={`rounded-xl px-3 py-2 max-w-[85%] ${
                      msg.isFromAdmin ? 'bg-green-100 dark:bg-green-900/30' : msg.isFromAI ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-blue-500 text-white'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content || ''}</p>
                      <p className="text-xs opacity-60 mt-1">
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleString('ar') : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply */}
              {selectedTicket.status !== 'CLOSED' && (
                <div className="pt-3 border-t mt-3">
                  <div className="flex gap-2">
                    <Textarea 
                      value={replyMessage} 
                      onChange={(e) => setReplyMessage(e.target.value)} 
                      placeholder="اكتب ردك..." 
                      rows={2} 
                      className="flex-1 resize-none" 
                    />
                    <Button onClick={sendReply} disabled={!replyMessage.trim() || sendingReply} className="self-end">
                      {sendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
