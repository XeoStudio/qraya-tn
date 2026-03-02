'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Ticket, 
  Plus, 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Send, 
  Bot,
  User,
  ChevronLeft,
  Loader2,
  RefreshCw
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { TICKET_CATEGORIES, TICKET_STATUS_LABELS } from '@/lib/constants'
import Link from 'next/link'

interface TicketMessage {
  id: string
  content: string
  isFromAI: boolean
  isFromAdmin: boolean
  createdAt: string
  user?: {
    name: string | null
  }
}

interface Ticket {
  id: string
  title: string
  category: string
  status: string
  priority: string
  messages: TicketMessage[]
  createdAt: string
  needsHumanIntervention: boolean
  rating: number | null
}

export default function SupportContent() {
  const { user, isLoading: authLoading } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newTicketTitle, setNewTicketTitle] = useState('')
  const [newTicketCategory, setNewTicketCategory] = useState('GENERAL')
  const [newTicketMessage, setNewTicketMessage] = useState('')
  const [replyMessage, setReplyMessage] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [showNewTicket, setShowNewTicket] = useState(false)

  useEffect(() => {
    if (!authLoading && user) {
      fetchTickets()
    }
  }, [user, authLoading])

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/tickets', { credentials: 'include' })
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

  const createTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTicketTitle.trim() || !newTicketMessage.trim()) return

    setCreating(true)
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'create',
          title: newTicketTitle,
          category: newTicketCategory,
          message: newTicketMessage
        })
      })
      const data = await res.json()
      if (data.success) {
        setTickets(prev => [data.ticket, ...prev])
        setSelectedTicket(data.ticket)
        setShowNewTicket(false)
        setNewTicketTitle('')
        setNewTicketCategory('GENERAL')
        setNewTicketMessage('')
      }
    } catch (error) {
      console.error('Error creating ticket:', error)
    } finally {
      setCreating(false)
    }
  }

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyMessage.trim() || !selectedTicket) return

    setSendingReply(true)
    try {
      const res = await fetch('/api/tickets', {
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
        setSelectedTicket(data.ticket)
        setTickets(prev => prev.map(t => t.id === data.ticket.id ? data.ticket : t))
        setReplyMessage('')
      }
    } catch (error) {
      console.error('Error sending reply:', error)
    } finally {
      setSendingReply(false)
    }
  }

  const requestHumanIntervention = async () => {
    if (!selectedTicket) return

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'request_human',
          ticketId: selectedTicket.id
        })
      })
      const data = await res.json()
      if (data.success) {
        setSelectedTicket(data.ticket)
        setTickets(prev => prev.map(t => t.id === data.ticket.id ? data.ticket : t))
      }
    } catch (error) {
      console.error('Error requesting human:', error)
    }
  }

  const getCategoryLabel = (category: string) => {
    const cat = TICKET_CATEGORIES.find(c => c.value === category)
    return cat?.label || category
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

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                مركز الدعم الفني
              </h1>
              <p className="text-gray-500 text-sm">نحن هنا لمساعدتك</p>
            </div>
          </div>
          <Button
            onClick={() => setShowNewTicket(true)}
            className="bg-blue-600 hover:bg-blue-700 gap-2"
          >
            <Plus className="w-4 h-4" />
            تذكرة جديدة
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tickets List */}
          <Card className="lg:col-span-1 p-4 border-0 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                تذاكرك
              </h2>
              <Button variant="ghost" size="sm" onClick={fetchTickets}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-8">
                <Ticket className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm">لا توجد تذاكر بعد</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {tickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`w-full text-right p-3 rounded-lg border transition-all ${
                        selectedTicket?.id === ticket.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
                          {ticket.title}
                        </span>
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(ticket.status)}`} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{getCategoryLabel(ticket.category)}</span>
                        <span>•</span>
                        <span>{TICKET_STATUS_LABELS[ticket.status]}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </Card>

          {/* Ticket Detail or New Ticket */}
          <Card className="lg:col-span-2 p-4 border-0 shadow-lg">
            {showNewTicket ? (
              <form onSubmit={createTicket} className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    إنشاء تذكرة جديدة
                  </h2>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewTicket(false)}
                  >
                    إلغاء
                  </Button>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                    عنوان التذكرة
                  </label>
                  <Input
                    value={newTicketTitle}
                    onChange={(e) => setNewTicketTitle(e.target.value)}
                    placeholder="مثال: مشكلة في تسجيل الدخول"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                    التصنيف
                  </label>
                  <Select value={newTicketCategory} onValueChange={setNewTicketCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TICKET_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                    وصف المشكلة
                  </label>
                  <Textarea
                    value={newTicketMessage}
                    onChange={(e) => setNewTicketMessage(e.target.value)}
                    placeholder="اشرح مشكلتك بالتفصيل..."
                    rows={5}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={creating}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin ml-2" />
                      جاري الإنشاء...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 ml-2" />
                      إنشاء التذكرة
                    </>
                  )}
                </Button>
              </form>
            ) : selectedTicket ? (
              <div className="flex flex-col h-[600px]">
                {/* Ticket Header */}
                <div className="pb-4 border-b mb-4">
                  <h2 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {selectedTicket.title}
                  </h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary">
                      {getCategoryLabel(selectedTicket.category)}
                    </Badge>
                    <Badge className={`${getStatusColor(selectedTicket.status)} text-white`}>
                      {TICKET_STATUS_LABELS[selectedTicket.status]}
                    </Badge>
                    {selectedTicket.needsHumanIntervention && (
                      <Badge variant="outline" className="border-orange-500 text-orange-500">
                        <AlertCircle className="w-3 h-3 ml-1" />
                        طلب تدخل يدوي
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 pr-2">
                  <div className="space-y-4">
                    {selectedTicket.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${
                          msg.isFromAI || msg.isFromAdmin ? '' : 'flex-row-reverse'
                        }`}
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
                          ) : msg.isFromAdmin ? (
                            <User className="w-4 h-4 text-white" />
                          ) : (
                            <User className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className={`rounded-xl px-4 py-2 max-w-[80%] ${
                          msg.isFromAI || msg.isFromAdmin
                            ? 'bg-white dark:bg-gray-800 shadow-sm'
                            : 'bg-blue-500 text-white'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <p className="text-xs opacity-60 mt-1">
                            {new Date(msg.createdAt).toLocaleString('ar')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Reply Form */}
                {selectedTicket.status !== 'CLOSED' && (
                  <div className="pt-4 border-t mt-4">
                    <form onSubmit={sendReply} className="space-y-3">
                      <Textarea
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="اكتب ردك..."
                        rows={2}
                        className="resize-none"
                      />
                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          disabled={sendingReply || !replyMessage.trim()}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          {sendingReply ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                        {!selectedTicket.needsHumanIntervention && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={requestHumanIntervention}
                            className="gap-2"
                          >
                            <User className="w-4 h-4" />
                            طلب تدخل يدوي
                          </Button>
                        )}
                      </div>
                    </form>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  اختر تذكرة لعرضها
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  أو أنشئ تذكرة جديدة للحصول على المساعدة
                </p>
                <Button onClick={() => setShowNewTicket(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  تذكرة جديدة
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
