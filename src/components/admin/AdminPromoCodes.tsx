'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Ticket, Plus, Trash2, RefreshCw, Loader2, Sparkles, Copy, Check } from 'lucide-react'

interface PromoCodeItem {
  id: string
  code: string
  planType: string
  duration: number | null
  maxUses: number | null
  usedCount: number
  isActive: boolean
  expiresAt: string | null
}

interface AdminPromoCodesProps {
  showMessage: (type: 'success' | 'error', message: string) => void
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

export default function AdminPromoCodes({ showMessage }: AdminPromoCodesProps) {
  const [promoCodes, setPromoCodes] = useState<PromoCodeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newCode, setNewCode] = useState('')
  const [newPlan, setNewPlan] = useState('BASIC')
  const [newDuration, setNewDuration] = useState('')
  const [creating, setCreating] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const fetchPromoCodes = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin?action=promocodes', { credentials: 'include' })
      const data = await res.json()
      setPromoCodes(data.success && Array.isArray(data.promoCodes) ? data.promoCodes : [])
    } catch {
      setPromoCodes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPromoCodes()
  }, [])

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
          duration: newDuration ? parseInt(newDuration) : null
        })
      })
      const data = await res.json()
      
      if (data.success) {
        showMessage('success', `تم إنشاء الكود ${newCode.toUpperCase()}`)
        setNewCode('')
        setNewDuration('')
        fetchPromoCodes()
      } else {
        showMessage('error', data.error || 'فشل الإنشاء')
      }
    } catch {
      showMessage('error', 'حدث خطأ')
    } finally {
      setCreating(false)
    }
  }

  const deletePromoCode = async (promoId: string, code: string) => {
    if (!confirm(`حذف الكود ${code}؟`)) return
    
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'delete-promo', promoId })
      })
      const data = await res.json()
      
      if (data.success) {
        showMessage('success', 'تم الحذف')
        fetchPromoCodes()
      } else {
        showMessage('error', 'فشل الحذف')
      }
    } catch {
      showMessage('error', 'حدث خطأ')
    }
  }

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length))
    setNewCode(code)
  }

  const copyToClipboard = async (code: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const getPlanLabel = (plan: string) => planLabels[plan] || plan
  const getPlanColor = (plan: string) => planColors[plan] || 'bg-gray-500'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Ticket className="w-5 h-5 text-pink-500" />
          أكواد الخصم
        </h3>
        <Button onClick={fetchPromoCodes} variant="outline" size="sm" className="gap-2" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>

      {/* Create */}
      <Card className="p-4">
        <h4 className="font-semibold mb-4">إنشاء كود جديد</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label>الكود</Label>
            <div className="flex gap-2">
              <Input value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())} placeholder="TUNISIA2025" className="font-mono" />
              <Button variant="outline" size="icon" onClick={generateRandomCode}><Sparkles className="w-4 h-4" /></Button>
            </div>
          </div>
          <div>
            <Label>الخطة</Label>
            <Select value={newPlan} onValueChange={setNewPlan}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="BASIC">أساسي</SelectItem>
                <SelectItem value="PREMIUM">متقدم</SelectItem>
                <SelectItem value="BAC_PRO">باك برو</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>المدة (أيام)</Label>
            <Input type="number" value={newDuration} onChange={(e) => setNewDuration(e.target.value)} placeholder="فارغ = دائم" />
          </div>
          <div className="flex items-end">
            <Button onClick={createPromoCode} disabled={creating || !newCode.trim()} className="w-full">
              {creating ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Plus className="w-4 h-4 ml-2" />}
              إنشاء
            </Button>
          </div>
        </div>
      </Card>

      {/* List */}
      <Card className="p-4">
        <h4 className="font-semibold mb-4">الأكواد ({promoCodes.length})</h4>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
        ) : promoCodes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">لا توجد أكواد</div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {promoCodes.map((promo) => (
              <div key={promo.id} className="flex items-center justify-between p-3 rounded-xl border gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="font-mono font-bold bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{promo.code}</code>
                    <button onClick={() => copyToClipboard(promo.code)} className="text-gray-400 hover:text-gray-600">
                      {copiedCode === promo.code ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <Badge className={`${getPlanColor(promo.planType)} text-white`}>{getPlanLabel(promo.planType)}</Badge>
                    <Badge variant={promo.isActive ? 'default' : 'secondary'}>{promo.isActive ? 'نشط' : 'معطل'}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                    <span>الاستخدام: {promo.usedCount} / {promo.maxUses || '∞'}</span>
                    {promo.duration && <span>المدة: {promo.duration} يوم</span>}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => deletePromoCode(promo.id, promo.code)} className="text-red-500 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
