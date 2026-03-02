'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Ticket, 
  Plus, 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  Send,
  User,
  Bot,
  Star,
  ArrowRight
} from 'lucide-react'
import { TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUS_LABELS } from '@/lib/constants'
import { useAuth } from '@/lib/auth-context'

interface TicketMessage {
  id: string
  content: string
  isFromAI: boolean
  isFromAdmin: boolean
  createdAt: string
  userId?: string
  user?: {
    name: string | null
  }
}

interface SupportTicket {
  id: string
  title: string
  category: string
  status: string
  priority: string
  messages: TicketMessage[]
  rating: number | null
  feedback: string | null
  needsHumanIntervention: boolean
  createdAt: string
  updatedAt: string
  closedAt: string | null
}

export default function SupportTickets() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewTicket, setShowNewTicket] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  
  // New ticket form
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState('GENERAL')
  const [newMessage, setNewMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  // Reply form
  const [replyMessage, setReplyMessage] = useState('')
  const [replying, setReplying] = useState(false)
  
  // Rating
  const [showRating, setShowRating] = useState(false)
  const [rating, setRating] = useState(5)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/tickets', {
        credentials: 'include'
      })
      const data = await res.json()
      if (data.success) {
        setTickets(data.tickets)
      }
    } catch {
      console.error('Failed to fetch tickets')
    } finally {
      setLoading(false)
    }
  }

  const createTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newMessage.trim()) return
    
    setSubmitting(true)
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          category: newCategory,
          message: newMessage
        }),
        credentials: 'include'
      })
      const data = await res.json()
      if (data.success) {
        setTickets(prev => [data.ticket, ...prev])
        setShowNewTicket(false)
        setNewTitle('')
        setNewCategory('GENERAL')
        setNewMessage('')
        // Open the new ticket
        setSelectedTicket(data.ticket)
      }
    } catch {
      console.error('Failed to create ticket')
    } finally {
      setSubmitting(false)
    }
  }

  const sendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) return
    
    setReplying(true)
    try {
      const res = await fetch('/api/tickets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          message: replyMessage
        }),
        credentials: 'include'
      })
      const data = await res.json()
      if (data.success) {
        setSelectedTicket(data.ticket)
        setTickets(prev => prev.map(t => t.id === data.ticket.id ? data.ticket : t))
        setReplyMessage('')
      }
    } catch {
      console.error('Failed to send reply')
    } finally {
      setReplying(false)
    }
  }

  const requestHumanIntervention = async () => {
    if (!selectedTicket) return
    
    try {
      const res = await fetch('/api/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          action: 'request_human'
        }),
        credentials: 'include'
      })
      const data = await res.json()
      if (data.success) {
        setSelectedTicket(data.ticket)
        setTickets(prev => prev.map(t => t.id === data.ticket.id ? data.ticket : t))
      }
    } catch {
      console.error('Failed to request human intervention')
    }
  }

  const submitRating = async () => {
    if (!selectedTicket) return
    
    try {
      const res = await fetch('/api/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          action: 'rate',
          rating,
          feedback
        }),
        credentials: 'include'
      })
      const data = await res.json()
      if (data.success) {
        setSelectedTicket(data.ticket)
        setTickets(prev => prev.map(t => t.id === data.ticket.id ? data.ticket : t))
        setShowRating(false)
      }
    } catch {
      console.error('Failed to submit rating')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-500'
      case 'IN_PROGRESS': return 'bg-yellow-500'
      case 'WAITING_USER': return 'bg-orange-500'
      case 'RESOLVED': return 'bg-green-500'
      case 'CLOSED': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getCategoryLabel = (category: string) => {
    return TICKET_CATEGORIES.find(c => c.value === category)?.label || category
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
            <Ticket className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">تذاكر الدعم</h2>
            <p className="text-sm text-gray-500">احصل على المساعدة من فريقنا</p>
          </div>
        </div>
        <Button
          onClick={() => setShowNewTicket(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600"
        >
          <Plus className="w-4 h-4 ml-2" />
          تذكرة جديدة
        </Button>
      </div>

      {/* Tickets List or Chat View */}
      {selectedTicket ? (
        <Card className="overflow-hidden">
          {/* Ticket Header */}
          <div className="p-4 border-b bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTicket(null)}
              >
                <ArrowRight className="w-4 h-4 ml-1" />
                العودة
              </Button>
              <Badge className={getStatusColor(selectedTicket.status)}>
                {TICKET_STATUS_LABELS[selectedTicket.status]}
              </Badge>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{selectedTicket.title}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
              <span>{getCategoryLabel(selectedTicket.category)}</span>
              <span>•</span>
              <span>{new Date(selectedTicket.createdAt).toLocaleDateString('ar-TN')}</span>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="h-[400px] p-4">
            <div className="space-y-4">
              {selectedTicket.messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex gap-3 ${msg.isFromAI || msg.isFromAdmin ? '' : 'flex-row-reverse'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.isFromAI 
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500' 
                      : msg.isFromAdmin 
                        ? 'bg-amber-500'
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
                  <div className={`rounded-2xl px-4 py-2 max-w-[80%] ${
                    msg.isFromAI || msg.isFromAdmin
                      ? 'bg-gray-100 dark:bg-gray-800'
                      : 'bg-blue-500 text-white'
                  }`}>
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                    <p className="text-xs mt-1 opacity-60">
                      {new Date(msg.createdAt).toLocaleTimeString('ar-TN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>

          {/* Actions */}
          {selectedTicket.status !== 'CLOSED' && (
            <div className="p-4 border-t bg-gray-50 dark:bg-gray-900">
              <div className="flex gap-2 mb-3">
                <Textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="اكتب ردك..."
                  className="resize-none"
                  rows={2}
                />
                <Button
                  onClick={sendReply}
                  disabled={!replyMessage.trim() || replying}
                  className="bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  {replying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              
              {!selectedTicket.needsHumanIntervention && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={requestHumanIntervention}
                  className="text-amber-600 border-amber-600"
                >
                  <AlertTriangle className="w-4 h-4 ml-1" />
                  طلب تدخل يدوي
                </Button>
              )}
            </div>
          )}

          {/* Rating for closed tickets */}
          {selectedTicket.status === 'CLOSED' && !selectedTicket.rating && (
            <div className="p-4 border-t bg-gray-50 dark:bg-gray-900">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">كيف كانت تجربتك؟</p>
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => { setRating(star); setShowRating(true) }}
                    className="p-1"
                  >
                    <Star className={`w-6 h-6 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                  </button>
                ))}
              </div>
              {showRating && (
                <div className="space-y-2">
                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="أضف تعليقك (اختياري)"
                    rows={2}
                  />
                  <Button onClick={submitRating} size="sm">
                    إرسال التقييم
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Rating Display */}
          {selectedTicket.rating && (
            <div className="p-4 border-t bg-green-50 dark:bg-green-900/20">
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${star <= selectedTicket.rating! ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">شكراً لتقييمك!</span>
              </div>
              {selectedTicket.feedback && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">"{selectedTicket.feedback}"</p>
              )}
            </div>
          )}
        </Card>
      ) : (
        <>
          {tickets.length === 0 ? (
            <Card className="p-8 text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                لا توجد تذاكر
              </h3>
              <p className="text-gray-500 mb-4">
                لم تقم بإنشاء أي تذاكر دعم بعد
              </p>
              <Button
                onClick={() => setShowNewTicket(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600"
              >
                <Plus className="w-4 h-4 ml-2" />
                إنشاء تذكرة جديدة
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket, index) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getStatusColor(ticket.status)}>
                            {TICKET_STATUS_LABELS[ticket.status]}
                          </Badge>
                          <Badge variant="outline">{getCategoryLabel(ticket.category)}</Badge>
                        </div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{ticket.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(ticket.createdAt).toLocaleDateString('ar-TN')}</span>
                          <span>•</span>
                          <span>{ticket.messages.length} رسالة</span>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* New Ticket Dialog */}
      <Dialog open={showNewTicket} onOpenChange={setShowNewTicket}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تذكرة دعم جديدة</DialogTitle>
            <DialogDescription>
              صف مشكلتك أو استفسارك وسنرد عليك في أقرب وقت
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createTicket} className="space-y-4">
            <div>
              <Label>العنوان</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="ملخص المشكلة"
                required
              />
            </div>
            <div>
              <Label>التصنيف</Label>
              <Select value={newCategory} onValueChange={setNewCategory}>
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
              <Label>التفاصيل</Label>
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="اشرح مشكلتك بالتفصيل..."
                rows={4}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                'إرسال التذكرة'
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
