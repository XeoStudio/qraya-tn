'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Ticket, 
  RefreshCw, 
  Loader2, 
  MessageCircle,
  Bot,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles,
  Send,
  ChevronLeft,
  Filter
} from 'lucide-react'

interface TicketMessage {
  id: string
  content: string
  isFromAI: boolean
  isFromAdmin: boolean
  createdAt: string
  user?: {
    name: string | null
    role?: string
  }
}

interface SupportTicket {
  id: string
  title: string
  category: string
  status: string
  priority: string
  needsHumanIntervention: boolean
  rating: number | null
  feedback: string | null
  createdAt: string
  updatedAt: string
  closedAt: string | null
  user: {
    id: string
    name: string | null
    email: string
    level?: string | null
    levelName?: string | null
  }
  lastMessage?: string
  messagesCount: number
  messages?: TicketMessage[]
}

interface TicketAnalysis {
  summary: string
  classification: string
  priority: string
  suggestedAction: string
}

interface AdminTicketsProps {
  showMessage: (type: 'success' | 'error', message: string) => void
}

export default function AdminTickets({ showMessage }: AdminTicketsProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [needsHumanOnly, setNeedsHumanOnly] = useState(false)
  
  // Selected ticket
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [ticketDetails, setTicketDetails] = useState<SupportTicket | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  
  // Reply
  const [replyMessage, setReplyMessage] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  
  // Analysis
  const [analysis, setAnalysis] = useState<TicketAnalysis | null>(null)
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    fetchTickets()
  }, [statusFilter, needsHumanOnly])

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        needsHuman: needsHumanOnly.toString()
      })
      
      const res = await fetch(`/api/admin/tickets?${params}`, { credentials: 'include' })
      const data = await res.json()
      if (data.success) {
        setTickets(data.tickets)
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTicketDetails = async (ticketId: string) => {
    setDetailsLoading(true)
    try {
      const res = await fetch('/api/admin/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'get-details',
          ticketId
        })
      })
      const data = await res.json()
      if (data.success) {
        setTicketDetails(data.ticket)
      }
    } catch (error) {
      console.error('Error fetching ticket details:', error)
    } finally {
      setDetailsLoading(false)
    }
  }

  const analyzeTicket = async () => {
    if (!selectedTicket) return
    
    setAnalyzing(true)
    try {
      const res = await fetch('/api/admin/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'analyze',
          ticketId: selectedTicket.id
        })
      })
      const data = await res.json()
      if (data.success) {
        setAnalysis(data.analysis)
      }
    } catch (error) {
      console.error('Error analyzing ticket:', error)
    } finally {
      setAnalyzing(false)
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
        body: JSON.stringify({
          action: 'reply',
          ticketId: selectedTicket.id,
          message: replyMessage
        })
      })
      const data = await res.json()
      if (data.success) {
        showMessage('success', 'تم إرسال الرد')
        setReplyMessage('')
        fetchTicketDetails(selectedTicket.id)
      } else {
        showMessage('error', data.error || 'فشل في إرسال الرد')
      }
    } catch (error) {
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
        body: JSON.stringify({
          action: 'close',
          ticketId: selectedTicket.id
        })
      })
      const data = await res.json()
      if (data.success) {
        showMessage('success', 'تم إغلاق التذكرة')
        fetchTickets()
        fetchTicketDetails(selectedTicket.id)
      }
    } catch (error) {
      showMessage('error', 'حدث خطأ')
    }
  }

  const reopenTicket = async () => {
    if (!selectedTicket) return
    
    try {
      const res = await fetch('/api/admin/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'reopen',
          ticketId: selectedTicket.id
        })
      })
      const data = await res.json()
      if (data.success) {
        showMessage('success', 'تم إعادة فتح التذكرة')
        fetchTickets()
        fetchTicketDetails(selectedTicket.id)
      }
    } catch (error) {
      showMessage('error', 'حدث خطأ')
    }
  }

  const acceptIntervention = async () => {
    if (!selectedTicket) return
    
    try {
      const res = await fetch('/api/admin/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'accept-intervention',
          ticketId: selectedTicket.id
        })
      })
      const data = await res.json()
      if (data.success) {
        showMessage('success', 'تم قبول طلب التدخل')
        fetchTickets()
        fetchTicketDetails(selectedTicket.id)
      }
    } catch (error) {
      showMessage('error', 'حدث خطأ')
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      OPEN: 'bg-blue-500',
      IN_PROGRESS: 'bg-yellow-500',
      WAITING_USER: 'bg-orange-500',
      RESOLVED: 'bg-green-500',
      CLOSED: 'bg-gray-500'
    }
    return colors[status] || 'bg-gray-500'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      OPEN: 'مفتوحة',
      IN_PROGRESS: 'قيد المعالجة',
      WAITING_USER: 'بانتظار رد المستخدم',
      RESOLVED: 'تم الحل',
      CLOSED: 'مغلقة'
    }
    return labels[status] || status
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: 'text-gray-500',
      MEDIUM: 'text-yellow-500',
      HIGH: 'text-orange-500',
      URGENT: 'text-red-500'
    }
    return colors[priority] || 'text-gray-500'
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      GENERAL: 'عام',
      TECHNICAL: 'تقني',
      BILLING: 'فواتير',
      SUGGESTION: 'اقتراح'
    }
    return labels[category] || category
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Ticket className="w-5 h-5 text-orange-500" />
          تذاكر الدعم الفني
        </h3>
        <Button onClick={fetchTickets} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          تحديث
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-3">
        <div className="flex flex-wrap gap-2">
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
          <Button
            variant={needsHumanOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setNeedsHumanOnly(!needsHumanOnly)}
            className="gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            تحتاج تدخل يدوي
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Tickets List */}
        <Card className="lg:col-span-1 p-3">
          <h4 className="font-semibold mb-3">التذاكر ({tickets.length})</h4>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              لا توجد تذاكر
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => {
                      setSelectedTicket(ticket)
                      fetchTicketDetails(ticket.id)
                      setAnalysis(null)
                    }}
                    className={`w-full text-right p-3 rounded-xl border transition-all ${
                      selectedTicket?.id === ticket.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{ticket.title}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {ticket.user.name || ticket.user.email}
                        </p>
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {getCategoryLabel(ticket.category)}
                          </Badge>
                          <Badge className={`${getStatusColor(ticket.status)} text-white text-xs`}>
                            {getStatusLabel(ticket.status)}
                          </Badge>
                          {ticket.needsHumanIntervention && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="w-3 h-3 ml-1" />
                              تدخل
                            </Badge>
                          )}
                        </div>
                      </div>
                      <span className={`text-xs ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority === 'URGENT' && '🔴'}
                        {ticket.priority === 'HIGH' && '🟠'}
                        {ticket.priority === 'MEDIUM' && '🟡'}
                        {ticket.priority === 'LOW' && '⚪'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </Card>

        {/* Ticket Details */}
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
          ) : ticketDetails ? (
            <div className="flex flex-col h-[550px]">
              {/* Header */}
              <div className="pb-3 border-b mb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold">{ticketDetails.title}</h4>
                    <p className="text-sm text-gray-500">
                      {ticketDetails.user.name || ticketDetails.user.email}
                      {ticketDetails.user.levelName && ` - ${ticketDetails.user.levelName}`}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {ticketDetails.needsHumanIntervention && ticketDetails.status !== 'CLOSED' && (
                      <Button size="sm" onClick={acceptIntervention} className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="w-4 h-4 ml-1" />
                        قبول التدخل
                      </Button>
                    )}
                    {ticketDetails.status !== 'CLOSED' ? (
                      <Button size="sm" variant="outline" onClick={closeTicket}>
                        إغلاق
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={reopenTicket}>
                        إعادة فتح
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge variant="outline">{getCategoryLabel(ticketDetails.category)}</Badge>
                  <Badge className={`${getStatusColor(ticketDetails.status)} text-white`}>
                    {getStatusLabel(ticketDetails.status)}
                  </Badge>
                  {ticketDetails.needsHumanIntervention && (
                    <Badge variant="destructive">
                      <AlertTriangle className="w-3 h-3 ml-1" />
                      طلب تدخل يدوي
                    </Badge>
                  )}
                </div>
              </div>

              {/* AI Analysis */}
              <div className="mb-3">
                {analysis ? (
                  <Card className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span className="font-medium text-sm">تحليل AI</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">الملخص</p>
                        <p>{analysis.summary}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">الأولوية المقترحة</p>
                        <p>{analysis.priority}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">التصنيف</p>
                        <p>{analysis.classification}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">الإجراء المقترح</p>
                        <p>{analysis.suggestedAction}</p>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={analyzeTicket}
                    disabled={analyzing}
                    className="w-full"
                  >
                    {analyzing ? (
                      <><Loader2 className="w-4 h-4 animate-spin ml-2" />جاري التحليل...</>
                    ) : (
                      <><Sparkles className="w-4 h-4 ml-2" />تحليل بالذكاء الاصطناعي</>
                    )}
                  </Button>
                )}
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 pr-2">
                <div className="space-y-3">
                  {ticketDetails.messages?.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-2 ${msg.isFromAdmin ? '' : msg.isFromAI ? '' : 'flex-row-reverse'}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        msg.isFromAI
                          ? 'bg-gradient-to-r from-purple-500 to-blue-500'
                          : msg.isFromAdmin
                          ? 'bg-green-500'
                          : 'bg-blue-500'
                      }`}>
                        {msg.isFromAI ? (
                          <Bot className="w-4 h-4 text-white" />
                        ) : (
                          <User className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div className={`rounded-xl px-3 py-2 max-w-[85%] ${
                        msg.isFromAdmin
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : msg.isFromAI
                          ? 'bg-purple-100 dark:bg-purple-900/30'
                          : 'bg-blue-500 text-white'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p className="text-xs opacity-60 mt-1">
                          {new Date(msg.createdAt).toLocaleString('ar')}
                          {msg.isFromAdmin && ' • أدمن'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Reply */}
              {ticketDetails.status !== 'CLOSED' && (
                <div className="pt-3 border-t mt-3">
                  <div className="flex gap-2">
                    <Textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="اكتب ردك..."
                      rows={2}
                      className="flex-1 resize-none"
                    />
                    <Button
                      onClick={sendReply}
                      disabled={!replyMessage.trim() || sendingReply}
                      className="self-end"
                    >
                      {sendingReply ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  )
}
