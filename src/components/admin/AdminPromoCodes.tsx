'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { 
  Ticket, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Loader2,
  CheckCircle,
  XCircle,
  Sparkles,
  Copy,
  Check
} from 'lucide-react'

interface PromoCode {
  id: string
  code: string
  planType: string
  duration: number | null
  maxUses: number | null
  usedCount: number
  totalUsages: number
  isActive: boolean
  features: {
    agentMode: boolean
    advancedAI: boolean
    unlimitedChat: boolean
    priority: boolean
    exportPDF: boolean
    ocrUnlimited: boolean
    customPlans: boolean
  }
  expiresAt: string | null
  createdAt: string
}

interface AdminPromoCodesProps {
  showMessage: (type: 'success' | 'error', message: string) => void
}

export default function AdminPromoCodes({ showMessage }: AdminPromoCodesProps) {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  
  // New promo code form
  const [newCode, setNewCode] = useState('')
  const [newPlan, setNewPlan] = useState('BASIC')
  const [newDuration, setNewDuration] = useState('')
  const [newMaxUses, setNewMaxUses] = useState('')
  const [creating, setCreating] = useState(false)
  
  // Features
  const [features, setFeatures] = useState({
    agentMode: false,
    advancedAI: false,
    unlimitedChat: false,
    priority: false,
    exportPDF: false,
    ocrUnlimited: false,
    customPlans: false
  })
  
  // Copy
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    fetchPromoCodes()
  }, [])

  useEffect(() => {
    // Auto-set features based on plan
    if (newPlan === 'PREMIUM') {
      setFeatures({
        agentMode: true,
        advancedAI: true,
        unlimitedChat: true,
        priority: true,
        exportPDF: true,
        ocrUnlimited: false,
        customPlans: false
      })
    } else if (newPlan === 'BAC_PRO') {
      setFeatures({
        agentMode: true,
        advancedAI: true,
        unlimitedChat: true,
        priority: true,
        exportPDF: true,
        ocrUnlimited: true,
        customPlans: true
      })
    } else {
      setFeatures({
        agentMode: false,
        advancedAI: false,
        unlimitedChat: false,
        priority: false,
        exportPDF: false,
        ocrUnlimited: false,
        customPlans: false
      })
    }
  }, [newPlan])

  const fetchPromoCodes = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin?action=promocodes', { credentials: 'include' })
      const data = await res.json()
      if (data.success) {
        setPromoCodes(data.promoCodes)
      }
    } catch (error) {
      console.error('Error fetching promo codes:', error)
    } finally {
      setLoading(false)
    }
  }

  const createPromoCode = async () => {
    if (!newCode.trim()) {
      showMessage('error', 'الرجاء إدخال الكود')
      return
    }
    
    setCreating(true)
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'create-promo',
          code: newCode.toUpperCase(),
          planType: newPlan,
          duration: newDuration ? parseInt(newDuration) : null,
          maxUses: newMaxUses ? parseInt(newMaxUses) : null,
          ...features
        })
      })
      const data = await res.json()
      
      if (data.success) {
        showMessage('success', `تم إنشاء الكود ${newCode.toUpperCase()} بنجاح!`)
        setNewCode('')
        setNewDuration('')
        setNewMaxUses('')
        fetchPromoCodes()
      } else {
        showMessage('error', data.error || 'فشل في إنشاء الكود')
      }
    } catch (error) {
      showMessage('error', 'حدث خطأ')
    } finally {
      setCreating(false)
    }
  }

  const deletePromoCode = async (promoId: string, code: string) => {
    if (!confirm(`هل أنت متأكد من حذف الكود ${code}؟`)) return
    
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'delete-promo',
          promoId
        })
      })
      const data = await res.json()
      
      if (data.success) {
        showMessage('success', 'تم حذف الكود بنجاح')
        fetchPromoCodes()
      } else {
        showMessage('error', 'فشل في حذف الكود')
      }
    } catch (error) {
      showMessage('error', 'حدث خطأ')
    }
  }

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewCode(code)
  }

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch {
      showMessage('error', 'فشل في نسخ الكود')
    }
  }

  const planLabels: Record<string, string> = {
    FREE: 'مجاني',
    BASIC: 'أساسي',
    PREMIUM: 'متقدم',
    BAC_PRO: 'باك برو'
  }

  const planColors: Record<string, string> = {
    BASIC: 'bg-blue-500',
    PREMIUM: 'bg-purple-500',
    BAC_PRO: 'bg-amber-500'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Ticket className="w-5 h-5 text-pink-500" />
          أكواد الخصم
        </h3>
        <Button onClick={fetchPromoCodes} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          تحديث
        </Button>
      </div>

      {/* Create New Code */}
      <Card className="p-4">
        <h4 className="font-semibold mb-4">إنشاء كود جديد</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label>الكود</Label>
            <div className="flex gap-2">
              <Input
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="TUNISIA2025"
                className="font-mono"
              />
              <Button variant="outline" size="icon" onClick={generateRandomCode}>
                <Sparkles className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div>
            <Label>الخطة</Label>
            <Select value={newPlan} onValueChange={setNewPlan}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BASIC">أساسي</SelectItem>
                <SelectItem value="PREMIUM">متقدم</SelectItem>
                <SelectItem value="BAC_PRO">باك برو</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>المدة (أيام)</Label>
            <Input
              type="number"
              value={newDuration}
              onChange={(e) => setNewDuration(e.target.value)}
              placeholder="فارغ = دائم"
            />
          </div>
          <div>
            <Label>الحد الأقصى للاستخدام</Label>
            <Input
              type="number"
              value={newMaxUses}
              onChange={(e) => setNewMaxUses(e.target.value)}
              placeholder="غير محدود"
            />
          </div>
        </div>
        
        {/* Features */}
        <div className="mt-4 border-t pt-4">
          <Label className="mb-2 block">المميزات الإضافية</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { key: 'agentMode', label: 'وضع الوكيل' },
              { key: 'advancedAI', label: 'ذكاء متقدم' },
              { key: 'unlimitedChat', label: 'محادثات غير محدودة' },
              { key: 'priority', label: 'أولوية الرد' },
              { key: 'exportPDF', label: 'تصدير PDF' },
              { key: 'ocrUnlimited', label: 'OCR غير محدود' },
              { key: 'customPlans', label: 'خطط مخصصة' }
            ].map((feature) => (
              <label key={feature.key} className="flex items-center gap-2 text-sm cursor-pointer">
                <Switch
                  checked={features[feature.key as keyof typeof features]}
                  onCheckedChange={(checked) => 
                    setFeatures(prev => ({ ...prev, [feature.key]: checked }))
                  }
                />
                {feature.label}
              </label>
            ))}
          </div>
        </div>
        
        <Button
          onClick={createPromoCode}
          disabled={creating || !newCode.trim()}
          className="mt-4 w-full sm:w-auto"
        >
          {creating ? (
            <><Loader2 className="w-4 h-4 animate-spin ml-2" />جاري الإنشاء...</>
          ) : (
            <><Plus className="w-4 h-4 ml-2" />إنشاء كود</>
          )}
        </Button>
      </Card>

      {/* Existing Codes */}
      <Card className="p-4">
        <h4 className="font-semibold mb-4">الأكواد الموجودة ({promoCodes.length})</h4>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : promoCodes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            لا توجد أكواد
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {promoCodes.map((promo) => (
                <div
                  key={promo.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-xl border gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="font-mono font-bold text-lg bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {promo.code}
                      </code>
                      <button
                        onClick={() => copyToClipboard(promo.code)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {copiedCode === promo.code ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <Badge className={`${planColors[promo.planType]} text-white`}>
                        {planLabels[promo.planType]}
                      </Badge>
                      <Badge variant={promo.isActive ? 'default' : 'secondary'}>
                        {promo.isActive ? 'نشط' : 'معطل'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <span>الاستخدام: {promo.usedCount} / {promo.maxUses || '∞'}</span>
                      {promo.duration && <span>المدة: {promo.duration} يوم</span>}
                      {promo.expiresAt && (
                        <span>ينتهي: {new Date(promo.expiresAt).toLocaleDateString('ar')}</span>
                      )}
                    </div>
                    {/* Features badges */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {promo.features.agentMode && (
                        <Badge variant="outline" className="text-xs">🤖 وكيل</Badge>
                      )}
                      {promo.features.advancedAI && (
                        <Badge variant="outline" className="text-xs">🧠 ذكاء متقدم</Badge>
                      )}
                      {promo.features.unlimitedChat && (
                        <Badge variant="outline" className="text-xs">💬 غير محدود</Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deletePromoCode(promo.id, promo.code)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </Card>
    </div>
  )
}
