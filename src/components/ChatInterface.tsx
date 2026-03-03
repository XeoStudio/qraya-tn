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
  BarChart3,
  FileDown,
  PenTool,
  Calculator,
  Languages,
  Copy,
  Check,
  Eye
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ERROR_MESSAGES } from '@/lib/constants'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: SearchResult[]
  timestamp: Date
  type?: 'text' | 'file' | 'image'
  imageData?: { url: string }
  fileName?: string
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

const agentCapabilities = [
  { icon: FileDown, label: 'إنشاء PDF', prompt: 'أنشئ ملخص PDF مفصل في ', description: 'ملخص منسق' },
  { icon: BarChart3, label: 'رسم بياني', prompt: 'ارسم لي دالة رياضية: ', description: 'رسم دوال' },
  { icon: PenTool, label: 'امتحان كامل', prompt: 'أنشئ امتحاناً كاملاً مع التصحيح في مادة ', description: 'امتحان مع الحل' },
  { icon: Calculator, label: 'حل مسائل', prompt: 'حل هذه المسألة خطوة بخطوة: ', description: 'حل تفصيلي' },
  { icon: Languages, label: 'ترجمة', prompt: 'ترجم وأشرح هذا النص: ', description: 'ترجمة مع شرح' },
  { icon: FileText, label: 'خط مراجعة', prompt: 'أنشئ خطة مراجعة للبكالوريا في مادة ', description: 'خطة Bac' }
]

// Format AI response
function formatAIResponse(content: string): React.ReactNode {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  
  lines.forEach((line, index) => {
    const key = `line-${index}`
    
    if (line.startsWith('### ')) {
      elements.push(<h4 key={key} className="font-bold text-base mt-3 mb-1 text-purple-700 dark:text-purple-300">{line.replace('### ', '')}</h4>)
    } else if (line.startsWith('## ')) {
      elements.push(<h3 key={key} className="font-bold text-lg mt-3 mb-1 text-blue-700 dark:text-blue-300 border-b pb-1">{line.replace('## ', '')}</h3>)
    } else if (line.startsWith('# ')) {
      elements.push(<h2 key={key} className="font-bold text-xl mt-3 mb-2 text-gray-800 dark:text-white">{line.replace('# ', '')}</h2>)
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      elements.push(<div key={key} className="flex items-start gap-2 my-0.5 text-sm"><span className="text-blue-500 mt-1">•</span><span>{formatInlineStyles(line.replace(/^[-•] /, ''))}</span></div>)
    } else if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s(.*)/)
      if (match) {
        elements.push(<div key={key} className="flex items-start gap-2 my-0.5 text-sm"><span className="font-bold text-purple-600 min-w-[20px]">{match[1]}.</span><span>{formatInlineStyles(match[2])}</span></div>)
      }
    } else if (line.trim()) {
      elements.push(<p key={key} className="text-sm my-0.5">{formatInlineStyles(line)}</p>)
    } else {
      elements.push(<div key={key} className="h-1" />)
    }
  })
  
  return <div className="space-y-0.5">{elements}</div>
}

function formatInlineStyles(text: string): React.ReactNode {
  // Bold
  const boldMatch = text.match(/\*\*(.+?)\*\*/)
  if (boldMatch) {
    const [full, content] = boldMatch
    const index = text.indexOf(full)
    return (
      <>
        {index > 0 && text.substring(0, index)}
        <strong className="font-bold">{content}</strong>
        {text.substring(index + full.length)}
      </>
    )
  }
  
  // Code
  const codeMatch = text.match(/`(.+?)`/)
  if (codeMatch) {
    const [full, content] = codeMatch
    const index = text.indexOf(full)
    return (
      <>
        {index > 0 && text.substring(0, index)}
        <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-xs">{content}</code>
        {text.substring(index + full.length)}
      </>
    )
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
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  // File/Image upload states
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [pendingImage, setPendingImage] = useState<string | null>(null)
  const [uploadedFileContent, setUploadedFileContent] = useState<{ name: string; content: string } | null>(null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const searchWeb = async (query: string): Promise<SearchResult[]> => {
    try {
      const res = await fetch('/api/web-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, num: 3 }),
        credentials: 'include'
      })
      const data = await res.json()
      return data.success && Array.isArray(data.results) ? data.results : []
    } catch {
      return []
    }
  }

  // Handle file upload - always analyze content
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Reset input to allow re-upload of same file
    e.target.value = ''
    
    setIsUploading(true)
    setUploadProgress('جاري قراءة الملف...')
    
    const reader = new FileReader()
    reader.onload = async (event) => {
      const content = event.target?.result as string
      if (content) {
        setUploadedFileContent({ name: file.name, content: content.substring(0, 5000) })
        setInput(prev => prev + `\n\n[ملف: ${file.name}]`)
      }
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

  // Handle image upload - show dialog
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Reset input to allow re-upload of same file
    e.target.value = ''
    
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setPendingImage(base64)
      setShowImageDialog(true)
    }
    reader.readAsDataURL(file)
  }

  // Process image with Vision AI
  const processImageWithVision = () => {
    if (!pendingImage) return
    
    setShowImageDialog(false)
    setUploadedImage(pendingImage)
    setInput(prev => prev + '\n\n[صورة للتحليل]')
    setPendingImage(null)
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
      type: uploadedFileContent ? 'file' : uploadedImage ? 'image' : 'text',
      imageData: uploadedImage ? { url: uploadedImage } : undefined,
      fileName: uploadedFileContent?.name
    }
    
    setMessages(prev => [...prev, newMessage])
    setLoading(true)
    
    // Store current uploads
    const currentFileContent = uploadedFileContent
    const currentImage = uploadedImage
    
    // Reset uploads
    setUploadedFileContent(null)
    setUploadedImage(null)

    let sources: SearchResult[] = []

    if (webSearchEnabled) {
      setSearching(true)
      sources = await searchWeb(userMessage)
      setSearching(false)
    }

    try {
      let res: Response
      let endpoint = '/api/chat'
      let body: Record<string, unknown> = {
        message: userMessage,
        history: messages.map(m => ({ role: m.role, content: m.content })),
        enableWebSearch: webSearchEnabled,
        agentMode
      }

      // If file content, use file analysis endpoint
      if (currentFileContent) {
        endpoint = '/api/chat/file'
        body = {
          message: userMessage.replace(/\[ملف:.*?\]/g, '').trim() || 'حلل هذا المحتوى',
          fileName: currentFileContent.name,
          content: currentFileContent.content,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          agentMode
        }
      }
      // If image, use vision endpoint
      else if (currentImage) {
        endpoint = '/api/chat/vision'
        body = {
          message: userMessage.replace('[صورة للتحليل]', '').trim() || 'ماذا ترى في هذه الصورة؟',
          image: currentImage.split(',')[1],
          history: messages.map(m => ({ role: m.role, content: m.content })),
          agentMode
        }
      }

      res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include'
      })

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
          prev.filter(m => m.id !== tempId).concat({ 
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
    } catch (err) {
      console.error('Chat error:', err)
      setError(ERROR_MESSAGES.NETWORK_ERROR)
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages, webSearchEnabled, agentMode, uploadedFileContent, uploadedImage, isUploading])

  const clearChat = () => {
    setMessages([])
    setError(null)
    setUploadedFileContent(null)
    setUploadedImage(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const retryLastMessage = () => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
    if (lastUserMessage) {
      setInput(lastUserMessage.content)
      setMessages(prev => prev.filter(m => m.id !== lastUserMessage.id))
      setError(null)
    }
  }

  const copyToClipboard = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const isDisabled = loading || isUploading || !input.trim()

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
            <p className="text-xs text-white/80">{agentMode ? '🤖 وضع الوكيل الذكي' : 'مدعوم بالذكاء الاصطناعي'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant={agentMode ? 'default' : 'outline'} size="sm" onClick={() => setAgentMode(!agentMode)} className={`gap-1 text-xs ${agentMode ? 'bg-amber-500 text-white border-0' : 'border-white/30 text-white hover:bg-white/10'}`}>
            <Wand2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">وكيل</span>
          </Button>
          <Button variant={webSearchEnabled ? 'default' : 'outline'} size="sm" onClick={() => setWebSearchEnabled(!webSearchEnabled)} className={`gap-1 text-xs ${webSearchEnabled ? 'bg-white text-blue-600 border-0' : 'border-white/30 text-white hover:bg-white/10'}`}>
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">بحث</span>
          </Button>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearChat} className="text-white hover:bg-white/20 p-2">
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
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mb-3">
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">كيف أقدر نساعدك؟</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm text-sm mb-3">{agentMode ? 'وضع الوكيل الذكي: إنشاء امتحانات، رسوم بيانية، PDF' : 'اسألني عن أي درس وسأشرحه لك'}</p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {webSearchEnabled && <Badge variant="secondary" className="text-xs"><Globe className="w-3 h-3 mr-1" />البحث مفعّل</Badge>}
                {agentMode && <Badge className="text-xs bg-amber-500"><Wand2 className="w-3 h-3 mr-1" />الوكيل مفعّل</Badge>}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-1 max-w-lg">
                {(agentMode ? agentCapabilities : quickActions).map((action, i) => (
                  <Button key={i} variant="outline" size="sm" onClick={() => setInput(action.prompt)} className="text-xs bg-white dark:bg-gray-800 h-auto py-2 flex flex-col items-center gap-0.5">
                    {'icon' in action && <action.icon className="w-4 h-4" />}
                    <span>{action.label}</span>
                    {'description' in action && <span className="text-[10px] text-gray-400">{action.description}</span>}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4">Enter = سطر جديد • Ctrl+Enter = إرسال</p>
            </div>
          ) : (
            <div className="space-y-3 pb-3">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div key={message.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === 'user' ? 'bg-blue-500' : 'bg-gradient-to-r from-purple-500 to-blue-500'}`}>
                      {message.role === 'user' ? <User className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div className="flex-1 max-w-[85%]">
                      {message.imageData?.url && <img src={message.imageData.url} alt="صورة مرفوعة" className="max-w-[200px] rounded-lg mb-2 border" />}
                      {message.fileName && <div className="text-xs text-gray-500 mb-1">📄 {message.fileName}</div>}
                      <div className={`rounded-2xl px-3 py-2 ${message.role === 'user' ? 'bg-blue-500 text-white ml-auto' : 'bg-white dark:bg-gray-800 shadow-md border dark:border-gray-700'}`}>
                        {message.role === 'assistant' ? formatAIResponse(message.content) : <p className="whitespace-pre-wrap text-sm">{message.content}</p>}
                      </div>
                      {message.role === 'assistant' && (
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(message.content, message.id)} className="mt-1 h-6 text-xs text-gray-400">
                          {copiedId === message.id ? <><Check className="w-3 h-3 mr-1" />تم النسخ</> : <><Copy className="w-3 h-3 mr-1" />نسخ</>}
                        </Button>
                      )}
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 flex items-center gap-1"><Globe className="w-3 h-3" />مصادر:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {message.sources.map((source, i) => (
                              <a key={i} href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full hover:underline">
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
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl px-3 py-2 shadow-md border dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      {searching ? <><Globe className="w-4 h-4 animate-pulse text-blue-500" /><span className="text-sm text-gray-500">جاري البحث...</span></> : <><Loader2 className="w-4 h-4 animate-spin text-purple-500" /><span className="text-sm text-gray-500">جاري الكتابة...</span></>}
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-3 mb-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <p className="text-xs text-red-600 dark:text-red-400 flex-1">{error}</p>
          <Button variant="ghost" size="sm" onClick={retryLastMessage} className="text-red-600 text-xs p-1"><RefreshCw className="w-3 h-3 ml-1" />إعادة</Button>
        </motion.div>
      )}

      {/* Upload indicators */}
      {(uploadedFileContent || uploadedImage) && !isUploading && (
        <div className="mx-3 mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-2">
          {uploadedImage ? <img src={uploadedImage} alt="صورة" className="w-10 h-10 rounded object-cover" /> : <FileText className="w-4 h-4 text-blue-500" />}
          <span className="text-xs text-blue-600 flex-1">{uploadedFileContent?.name || 'صورة للتحليل'}</span>
          <Button variant="ghost" size="sm" onClick={() => { setUploadedFileContent(null); setUploadedImage(null) }} className="p-1"><X className="w-3 h-3" /></Button>
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
        <div className="flex gap-1 mb-2">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".txt,.md,.csv" className="hidden" />
          <input type="file" ref={imageInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="text-xs gap-1">
            <FileText className="w-3 h-3" />
            <span className="hidden sm:inline">ملف</span>
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => imageInputRef.current?.click()} disabled={isUploading} className="text-xs gap-1">
            <Image className="w-3 h-3" />
            <span className="hidden sm:inline">صورة</span>
          </Button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); sendMessage() }} className="flex gap-2">
          <Textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder={agentMode ? "وضع الوكيل: أمرني بما تريد..." : "اكتب رسالتك هنا..."} className="resize-none min-h-[40px] max-h-28 text-sm" onKeyDown={handleKeyDown} disabled={loading || isUploading} />
          <Button type="submit" disabled={isDisabled} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-4" size="icon">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
        <p className="text-[10px] text-gray-400 mt-1.5 text-center">Enter = سطر جديد • Ctrl+Enter = إرسال</p>
      </div>

      {/* Image Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>تحليل الصورة</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            {pendingImage && <img src={pendingImage} alt="معاينة" className="w-full max-h-40 object-contain rounded-lg border" />}
            <p className="text-sm text-gray-500 text-center">سيتم تحليل الصورة بالذكاء الاصطناعي للإجابة على أسئلتك.</p>
            <Button onClick={processImageWithVision} className="w-full gap-2"><Eye className="w-4 h-4" />تحليل الصورة</Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setShowImageDialog(false); setPendingImage(null) }}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
