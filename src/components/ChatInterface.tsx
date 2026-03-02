'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  Send, 
  Loader2, 
  Bot, 
  User, 
  Sparkles,
  Trash2,
  Globe,
  BookOpen,
  FileText,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  GraduationCap
} from 'lucide-react'
import { AI_TIMEOUT, ERROR_MESSAGES } from '@/lib/constants'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: SearchResult[]
  timestamp: Date
}

interface SearchResult {
  url: string
  name: string
  snippet: string
}

interface ChatInterfaceProps {
  initialMessage?: string
}

const quickActions = [
  { icon: BookOpen, label: 'شرح درس', prompt: 'اشرح لي درس ' },
  { icon: FileText, label: 'تلخيص', prompt: 'لخص لي ' },
  { icon: Sparkles, label: 'مراجعة', prompt: 'ساعدني على مراجعة ' },
  { icon: GraduationCap, label: 'وضع المعلم', prompt: 'أريد خطة دراسة لمادة ' }
]

export default function ChatInterface({ initialMessage }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState(initialMessage || '')
  const [loading, setLoading] = useState(false)
  const [webSearchEnabled, setWebSearchEnabled] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const searchWeb = async (query: string, signal: AbortSignal): Promise<SearchResult[]> => {
    try {
      const res = await fetch('/api/web-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, num: 3 }),
        credentials: 'include',
        signal
      })
      const data = await res.json()
      if (data.success && Array.isArray(data.results)) {
        return data.results
      }
      return []
    } catch {
      return []
    }
  }

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setError(null)
    
    const tempId = `temp-${Date.now()}`
    setMessages(prev => [...prev, { 
      id: tempId, 
      role: 'user', 
      content: userMessage, 
      timestamp: new Date() 
    }])
    setLoading(true)

    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT)

    let sources: SearchResult[] = []

    // Search web if enabled
    if (webSearchEnabled) {
      setSearching(true)
      try {
        sources = await searchWeb(userMessage, controller.signal)
      } catch {
        // Ignore abort errors for search
      }
      setSearching(false)
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          webResults: sources,
          enableWebSearch: webSearchEnabled
        }),
        credentials: 'include',
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!res.ok) {
        if (res.status === 401) {
          setError(ERROR_MESSAGES.UNAUTHORIZED)
          setMessages(prev => prev.filter(m => m.id !== tempId))
          return
        }
        if (res.status === 429) {
          setError(ERROR_MESSAGES.QUOTA_EXCEEDED)
          return
        }
        throw new Error(ERROR_MESSAGES.AI_ERROR)
      }

      const data = await res.json()

      if (data.success) {
        setMessages(prev => 
          prev.map(m => m.id === tempId ? m : m).concat({ 
            id: `msg-${Date.now()}`,
            role: 'assistant', 
            content: data.response,
            sources: sources.length > 0 ? sources : undefined,
            timestamp: new Date()
          })
        )
      } else {
        setError(data.error || ERROR_MESSAGES.AI_ERROR)
      }
    } catch (err: unknown) {
      clearTimeout(timeoutId)
      if (err instanceof Error && err.name === 'AbortError') {
        setError(ERROR_MESSAGES.TIMEOUT)
      } else {
        setError(ERROR_MESSAGES.NETWORK_ERROR)
      }
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages, webSearchEnabled])

  const clearChat = () => {
    setMessages([])
    setError(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter = سطر جديد، Ctrl+Enter = إرسال
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      sendMessage()
    }
    // Enter alone creates new line (default behavior)
  }

  const retryLastMessage = () => {
    if (messages.length > 0) {
      const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
      if (lastUserMessage) {
        setInput(lastUserMessage.content)
        setMessages(prev => prev.filter(m => m.id !== lastUserMessage.id))
        setError(null)
      }
    }
  }

  return (
    <div className="flex flex-col h-[600px] max-w-3xl mx-auto rounded-xl border bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold">مساعد دراسة تونسي</h3>
            <p className="text-xs text-white/80">مدعوم بالذكاء الاصطناعي</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Web Search Toggle */}
          <Button
            variant={webSearchEnabled ? 'default' : 'outline'}
            size="sm"
            onClick={() => setWebSearchEnabled(!webSearchEnabled)}
            className={`gap-2 ${webSearchEnabled 
              ? 'bg-white text-blue-600 hover:bg-white/90' 
              : 'border-white/30 text-white hover:bg-white/10'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">البحث في الإنترنت</span>
          </Button>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="text-white hover:bg-white/20"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area - Scrollable */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4 bg-gray-50 dark:bg-gray-900">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center min-h-[350px]">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mb-4"
              >
                <Sparkles className="w-10 h-10 text-white" />
              </motion.div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                كيف أقدر نساعدك اليوم؟
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mb-4">
                اسألني عن أي درس أو مفهوم، وسأشرحه لك بطريقة بسيطة ومفهومة
              </p>
              
              {webSearchEnabled && (
                <Badge variant="secondary" className="mb-4">
                  <Globe className="w-3 h-3 mr-1" />
                  البحث في الإنترنت مفعّل
                </Badge>
              )}
              
              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {quickActions.map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    size="sm"
                    onClick={() => setInput(action.prompt)}
                    className="text-sm bg-white dark:bg-gray-800"
                  >
                    <action.icon className="w-4 h-4 ml-1" />
                    {action.label}
                  </Button>
                ))}
              </div>

              {/* Keyboard hint */}
              <p className="text-xs text-gray-400 mt-6">
                💡 اضغط Enter لسطر جديد، Ctrl+Enter للإرسال
              </p>
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user' 
                        ? 'bg-blue-500' 
                        : 'bg-gradient-to-r from-purple-500 to-blue-500'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className={`rounded-2xl px-4 py-2 max-w-[90%] ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white mr-auto ml-0'
                          : 'bg-white dark:bg-gray-800 shadow-md'
                      }`}>
                        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                      </div>
                      
                      {/* Web Sources */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-2 space-y-2">
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            مصادر من الإنترنت:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {message.sources.map((source, i) => (
                              <a
                                key={i}
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full hover:underline"
                              >
                                <ExternalLink className="w-3 h-3" />
                                {source.name || new URL(source.url).hostname}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {(loading || searching) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 shadow-md">
                    <div className="flex items-center gap-2">
                      {searching ? (
                        <>
                          <Globe className="w-4 h-4 animate-pulse text-blue-500" />
                          <span className="text-sm text-gray-500">جاري البحث في الإنترنت...</span>
                        </>
                      ) : (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                          <span className="text-sm text-gray-500">جاري الكتابة...</span>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2"
        >
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-600 dark:text-red-400 flex-1">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={retryLastMessage}
            className="text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50"
          >
            <RefreshCw className="w-4 h-4 ml-1" />
            إعادة
          </Button>
        </motion.div>
      )}

      {/* Input Area - Fixed at bottom */}
      <div className="flex-shrink-0 p-4 border-t bg-white dark:bg-gray-800">
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage() }}
          className="flex gap-2"
        >
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={webSearchEnabled ? "اكتب سؤالك مع البحث في الإنترنت..." : "اكتب رسالتك هنا... (Ctrl+Enter للإرسال)"}
            className="resize-none min-h-[44px] max-h-32"
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <Button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-4"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Enter = سطر جديد • Ctrl+Enter = إرسال
        </p>
      </div>
    </div>
  )
}
