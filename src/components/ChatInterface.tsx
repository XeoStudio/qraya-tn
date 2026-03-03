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
  GraduationCap,
  Wand2,
  Image,
  FileUp,
  X,
  Download,
  BarChart3,
  FileDown,
  PenTool,
  Calculator,
  Languages,
  Copy,
  Check,
  ScanText,
  Eye
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AI_TIMEOUT, ERROR_MESSAGES } from '@/lib/constants'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: SearchResult[]
  timestamp: Date
  type?: 'text' | 'file' | 'image' | 'code' | 'chart' | 'pdf'
  fileData?: { name: string; content: string; type: string }
  imageData?: { url: string; extractedText?: string }
  chartData?: { type: string; data: unknown; title: string }
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
  { icon: GraduationCap, label: 'خطة دراسة', prompt: 'أنشئ لي خطة دراسة لمادة ' }
]

// Agent mode capabilities
const agentCapabilities = [
  { 
    icon: FileDown, 
    label: '📄 إنشاء PDF', 
    prompt: 'أنشئ ملخص PDF مفصل في ',
    description: 'ملخص منسق للطباعة'
  },
  { 
    icon: BarChart3, 
    label: '📊 رسم بياني', 
    prompt: 'ارسم لي دالة رياضية: ',
    description: 'رسم دوال وبيانات'
  },
  { 
    icon: PenTool, 
    label: '📝 امتحان كامل', 
    prompt: 'أنشئ امتحاناً كاملاً مع التصحيح في مادة ',
    description: 'امتحان مع الحل'
  },
  { 
    icon: Calculator, 
    label: '🔢 حل مسائل', 
    prompt: 'حل هذه المسألة خطوة بخطوة مع الشرح: ',
    description: 'حل تفصيلي'
  },
  { 
    icon: Languages, 
    label: '🌐 ترجمة', 
    prompt: 'ترجم وأشرح هذا النص: ',
    description: 'ترجمة مع شرح'
  },
  { 
    icon: FileText, 
    label: '📋 خط مراجعة', 
    prompt: 'أنشئ خطة مراجعة مكثفة للبكالوريا في مادة ',
    description: 'خطة Bac'
  }
]

// Format AI response with proper markdown
function formatAIResponse(content: string): React.ReactNode {
  // Split content into sections
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  
  lines.forEach((line, index) => {
    const key = `line-${index}`
    
    // Headers
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={key} className="font-bold text-base mt-4 mb-2 text-purple-700 dark:text-purple-300">
          {line.replace('### ', '')}
        </h4>
      )
    } else if (line.startsWith('## ')) {
      elements.push(
        <h3 key={key} className="font-bold text-lg mt-4 mb-2 text-blue-700 dark:text-blue-300 border-b pb-1">
          {line.replace('## ', '')}
        </h3>
      )
    } else if (line.startsWith('# ')) {
      elements.push(
        <h2 key={key} className="font-bold text-xl mt-4 mb-3 text-gray-800 dark:text-white">
          {line.replace('# ', '')}
        </h2>
      )
    }
    // Bold text
    else if (line.startsWith('**') && line.endsWith('**')) {
      elements.push(
        <p key={key} className="font-bold text-sm my-1">
          {line.replace(/\*\*/g, '')}
        </p>
      )
    }
    // List items
    else if (line.startsWith('- ') || line.startsWith('• ')) {
      elements.push(
        <div key={key} className="flex items-start gap-2 my-1 text-sm">
          <span className="text-blue-500 mt-1">•</span>
          <span>{formatInlineStyles(line.replace(/^[-•] /, ''))}</span>
        </div>
      )
    }
    // Numbered list
    else if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s(.*)/)
      if (match) {
        elements.push(
          <div key={key} className="flex items-start gap-2 my-1 text-sm">
            <span className="font-bold text-purple-600 min-w-[20px]">{match[1]}.</span>
            <span>{formatInlineStyles(match[2])}</span>
          </div>
        )
      }
    }
    // Code blocks
    else if (line.startsWith('```')) {
      // Skip code fence markers
    }
    // Inline code
    else if (line.includes('`') && !line.includes('```')) {
      elements.push(
        <p key={key} className="text-sm my-1">
          {formatInlineStyles(line)}
        </p>
      )
    }
    // Regular text
    else if (line.trim()) {
      elements.push(
        <p key={key} className="text-sm my-1">
          {formatInlineStyles(line)}
        </p>
      )
    }
    // Empty line
    else {
      elements.push(<div key={key} className="h-2" />)
    }
  })
  
  return <div className="space-y-0.5">{elements}</div>
}

// Format inline styles (bold, italic, code)
function formatInlineStyles(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0
  
  // Bold
  const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
  if (boldMatch) {
    const [full, content] = boldMatch
    const index = remaining.indexOf(full)
    if (index > 0) {
      parts.push(remaining.substring(0, index))
    }
    parts.push(<strong key={`b-${key++}`} className="font-bold">{content}</strong>)
    remaining = remaining.substring(index + full.length)
    if (remaining) {
      parts.push(formatInlineStyles(remaining))
    }
    return parts
  }
  
  // Inline code
  const codeMatch = remaining.match(/`(.+?)`/)
  if (codeMatch) {
    const [full, content] = codeMatch
    const index = remaining.indexOf(full)
    if (index > 0) {
      parts.push(remaining.substring(0, index))
    }
    parts.push(
      <code key={`c-${key++}`} className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs font-mono">
        {content}
      </code>
    )
    remaining = remaining.substring(index + full.length)
    if (remaining) {
      parts.push(formatInlineStyles(remaining))
    }
    return parts
  }
  
  return text
}

export default function ChatInterface({ initialMessage }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState(initialMessage || '')
  const [loading, setLoading] = useState(false)
  const [webSearchEnabled, setWebSearchEnabled] = useState(false)
  const [agentMode, setAgentMode] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  // Image upload states
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [showImageOptions, setShowImageOptions] = useState(false)
  const [pendingImage, setPendingImage] = useState<string | null>(null)
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null)
  const [imageMode, setImageMode] = useState<'ocr' | 'vision'>('ocr')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Check file type
    const allowedTypes = [
      'text/plain', 'text/markdown', 'text/csv',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
    
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(txt|md|csv|pdf|doc|docx|xlsx)$/i)) {
      setError('نوع الملف غير مدعوم. الأنواع المدعومة: txt, md, csv, pdf, doc, docx, xlsx')
      return
    }
    
    setIsUploading(true)
    setUploadProgress('جاري قراءة الملف...')
    
    // Read file content
    const reader = new FileReader()
    reader.onload = async (event) => {
      const content = event.target?.result as string
      setUploadedFile(file)
      setInput(prev => prev + `\n\n[ملف مرفق: ${file.name}]\n${content.substring(0, 2000)}${content.length > 2000 ? '...' : ''}`)
      setIsUploading(false)
      setUploadProgress('')
    }
    reader.onerror = () => {
      setError('حدث خطأ في قراءة الملف')
      setIsUploading(false)
      setUploadProgress('')
    }
    reader.readAsText(file)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      setError('يرجى رفع صورة فقط')
      return
    }
    
    // Read image as base64
    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64 = event.target?.result as string
      // Store pending image and show options dialog
      setPendingImage(base64)
      setPendingImageFile(file)
      setShowImageOptions(true)
    }
    reader.readAsDataURL(file)
  }

  const processImageWithOCR = async () => {
    if (!pendingImage) return
    
    setShowImageOptions(false)
    setIsUploading(true)
    setUploadProgress('جاري استخراج النص من الصورة...')
    
    try {
      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: pendingImage.split(',')[1] }),
        credentials: 'include'
      })
      const data = await res.json()
      
      if (data.success && data.text) {
        setInput(prev => prev + `\n\n[نص مستخرج من الصورة]\n${data.text}`)
      } else {
        setError(data.error || 'فشل في استخراج النص')
      }
    } catch {
      setError('حدث خطأ في استخراج النص')
    } finally {
      setIsUploading(false)
      setUploadProgress('')
      setPendingImage(null)
      setPendingImageFile(null)
    }
  }

  const processImageWithVision = () => {
    if (!pendingImage) return
    
    setShowImageOptions(false)
    setUploadedImage(pendingImage)
    setInput(prev => prev + '\n\n[صورة مرفوعة للتحليل]')
    setPendingImage(null)
    setPendingImageFile(null)
  }

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading || isUploading) return

    const userMessage = input.trim()
    setInput('')
    setError(null)
    
    const tempId = `temp-${Date.now()}`
    const newMessage: Message = { 
      id: tempId, 
      role: 'user', 
      content: userMessage, 
      timestamp: new Date(),
      type: uploadedFile ? 'file' : uploadedImage ? 'image' : 'text',
      imageData: uploadedImage ? { url: uploadedImage } : undefined
    }
    
    setMessages(prev => [...prev, newMessage])
    setLoading(true)
    
    const currentUploadedImage = uploadedImage
    setUploadedFile(null)
    setUploadedImage(null)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT)

    let sources: SearchResult[] = []

    if (webSearchEnabled) {
      setSearching(true)
      try {
        sources = await searchWeb(userMessage, controller.signal)
      } catch {}
      setSearching(false)
    }

    try {
      // If image is uploaded, use vision API
      if (currentUploadedImage) {
        const res = await fetch('/api/chat/vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessage.replace('[صورة مرفوعة للتحليل]', '').trim() || 'ماذا ترى في هذه الصورة؟',
            image: currentUploadedImage.split(',')[1],
            history: messages.map(m => ({ role: m.role, content: m.content })),
            agentMode
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
      } else {
        // Regular text chat
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessage,
            history: messages.map(m => ({ role: m.role, content: m.content })),
            webResults: sources,
            enableWebSearch: webSearchEnabled,
            agentMode
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
  }, [input, loading, messages, webSearchEnabled, agentMode, uploadedFile, uploadedImage, isUploading])

  const clearChat = () => {
    setMessages([])
    setError(null)
    setUploadedFile(null)
    setUploadedImage(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      sendMessage()
    }
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

  const copyToClipboard = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {}
  }

  return (
    <div className="flex flex-col h-[650px] max-w-3xl mx-auto rounded-xl border bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-3 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">مساعد دراسة تونسي</h3>
            <p className="text-xs text-white/80">
              {agentMode ? '🤖 وضع الوكيل الذكي' : 'مدعوم بالذكاء الاصطناعي'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Agent Mode */}
          <Button
            variant={agentMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAgentMode(!agentMode)}
            className={`gap-1 text-xs ${agentMode 
              ? 'bg-amber-500 text-white hover:bg-amber-600 border-0' 
              : 'border-white/30 text-white hover:bg-white/10'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">وكيل</span>
          </Button>
          {/* Web Search */}
          <Button
            variant={webSearchEnabled ? 'default' : 'outline'}
            size="sm"
            onClick={() => setWebSearchEnabled(!webSearchEnabled)}
            className={`gap-1 text-xs ${webSearchEnabled 
              ? 'bg-white text-blue-600 hover:bg-white/90 border-0' 
              : 'border-white/30 text-white hover:bg-white/10'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">بحث</span>
          </Button>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="text-white hover:bg-white/20 p-2"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-3 bg-gray-50 dark:bg-gray-900">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center min-h-[400px]">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mb-3"
              >
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                كيف أقدر نساعدك؟
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm text-sm mb-3">
                {agentMode 
                  ? 'وضع الوكيل الذكي: إنشاء امتحانات، رسوم بيانية، PDF، وحلول مفصلة'
                  : 'اسألني عن أي درس وسأشرحه لك بطريقة بسيطة'
                }
              </p>
              
              <div className="flex flex-wrap gap-1.5 mb-4">
                {webSearchEnabled && (
                  <Badge variant="secondary" className="text-xs">
                    <Globe className="w-3 h-3 mr-1" />
                    البحث مفعّل
                  </Badge>
                )}
                {agentMode && (
                  <Badge className="text-xs bg-amber-500">
                    <Wand2 className="w-3 h-3 mr-1" />
                    الوكيل مفعّل
                  </Badge>
                )}
              </div>
              
              {/* Agent capabilities or Quick actions */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-1 max-w-lg">
                {(agentMode ? agentCapabilities : quickActions).map((action, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    onClick={() => setInput(action.prompt)}
                    className="text-xs bg-white dark:bg-gray-800 h-auto py-2 flex flex-col items-center gap-0.5"
                  >
                    {'icon' in action && <action.icon className="w-4 h-4" />}
                    <span>{action.label}</span>
                    {'description' in action && (
                      <span className="text-[10px] text-gray-400">{action.description}</span>
                    )}
                  </Button>
                ))}
              </div>

              <p className="text-xs text-gray-400 mt-4">
                Enter = سطر جديد • Ctrl+Enter = إرسال
              </p>
            </div>
          ) : (
            <div className="space-y-3 pb-3">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user' 
                        ? 'bg-blue-500' 
                        : 'bg-gradient-to-r from-purple-500 to-blue-500'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <Bot className="w-3.5 h-3.5 text-white" />
                      )}
                    </div>
                    <div className="flex-1 max-w-[85%]">
                      {/* Show image if available */}
                      {message.imageData?.url && (
                        <img 
                          src={message.imageData.url} 
                          alt="صورة مرفوعة" 
                          className="max-w-[200px] rounded-lg mb-2 border"
                        />
                      )}
                      <div className={`rounded-2xl px-3 py-2 ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white ml-auto'
                          : 'bg-white dark:bg-gray-800 shadow-md border dark:border-gray-700'
                      }`}>
                        {message.role === 'assistant' 
                          ? formatAIResponse(message.content)
                          : <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                        }
                      </div>
                      
                      {/* Copy button for AI messages */}
                      {message.role === 'assistant' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(message.content, message.id)}
                          className="mt-1 h-6 text-xs text-gray-400"
                        >
                          {copiedId === message.id ? (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              تم النسخ
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 mr-1" />
                              نسخ
                            </>
                          )}
                        </Button>
                      )}
                      
                      {/* Sources */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            مصادر:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {message.sources.map((source, i) => (
                              <a
                                key={i}
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full hover:underline"
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
                  className="flex gap-2"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl px-3 py-2 shadow-md border dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      {searching ? (
                        <>
                          <Globe className="w-4 h-4 animate-pulse text-blue-500" />
                          <span className="text-sm text-gray-500">جاري البحث...</span>
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
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-3 mb-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 text-red-500" />
          <p className="text-xs text-red-600 dark:text-red-400 flex-1">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={retryLastMessage}
            className="text-red-600 text-xs p-1"
          >
            <RefreshCw className="w-3 h-3 ml-1" />
            إعادة
          </Button>
        </motion.div>
      )}

      {/* Upload indicators */}
      {(uploadedFile || uploadedImage) && !isUploading && (
        <div className="mx-3 mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-2">
          {uploadedImage ? (
            <img src={uploadedImage} alt="صورة مرفوعة" className="w-10 h-10 rounded object-cover" />
          ) : (
            <FileUp className="w-4 h-4 text-blue-500" />
          )}
          <span className="text-xs text-blue-600 flex-1">
            {uploadedFile?.name || 'صورة مرفوعة للتحليل'}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setUploadedFile(null); setUploadedImage(null) }}
            className="p-1"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Uploading indicator */}
      {isUploading && (
        <div className="mx-3 mb-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
          <span className="text-xs text-amber-600 flex-1">{uploadProgress || 'جاري الرفع...'}</span>
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 p-3 border-t bg-white dark:bg-gray-800">
        {/* Upload buttons */}
        <div className="flex gap-1 mb-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".txt,.md,.csv,.pdf,.doc,.docx,.xlsx"
            className="hidden"
          />
          <input
            type="file"
            ref={imageInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="text-xs gap-1"
          >
            <FileUp className="w-3 h-3" />
            <span className="hidden sm:inline">ملف</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => imageInputRef.current?.click()}
            disabled={isUploading}
            className="text-xs gap-1"
          >
            <Image className="w-3 h-3" />
            <span className="hidden sm:inline">صورة</span>
          </Button>
        </div>
        
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage() }}
          className="flex gap-2"
        >
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={agentMode 
              ? "وضع الوكيل: أمرني بما تريد إنشاءه..." 
              : "اكتب رسالتك هنا..."
            }
            className="resize-none min-h-[40px] max-h-28 text-sm"
            onKeyDown={handleKeyDown}
            disabled={loading || isUploading}
          />
          <Button
            type="submit"
            disabled={!input.trim() || loading || isUploading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-4"
            size="icon"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
        <p className="text-[10px] text-gray-400 mt-1.5 text-center">
          Enter = سطر جديد • Ctrl+Enter = إرسال • {agentMode && 'وكيل ذكي مفعّل'}
        </p>
      </div>

      {/* Image Options Dialog */}
      <Dialog open={showImageOptions} onOpenChange={setShowImageOptions}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>خيار رفع الصورة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {pendingImage && (
              <img 
                src={pendingImage} 
                alt="معاينة الصورة" 
                className="w-full max-h-40 object-contain rounded-lg border"
              />
            )}
            <p className="text-sm text-gray-500 text-center">
              اختر كيف تريد معالجة الصورة:
            </p>
            <div className="grid grid-cols-1 gap-2">
              <Button
                variant="outline"
                onClick={processImageWithOCR}
                className="justify-start gap-3 h-auto py-3"
              >
                <ScanText className="w-5 h-5 text-blue-500" />
                <div className="text-right">
                  <p className="font-medium">استخراج النص (OCR)</p>
                  <p className="text-xs text-gray-500">استخراج النص المكتوب في الصورة</p>
                </div>
              </Button>
              <Button
                variant="outline"
                onClick={processImageWithVision}
                className="justify-start gap-3 h-auto py-3"
              >
                <Eye className="w-5 h-5 text-purple-500" />
                <div className="text-right">
                  <p className="font-medium">تحليل الصورة</p>
                  <p className="text-xs text-gray-500">رفع الصورة للذكاء الاصطناعي للتحليل</p>
                </div>
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => {
                setShowImageOptions(false)
                setPendingImage(null)
                setPendingImageFile(null)
              }}
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
