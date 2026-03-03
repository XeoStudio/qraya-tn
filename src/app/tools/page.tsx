'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import ToolsPanel from '@/components/ToolsPanel'
import { Loader2, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ToolsRoute() {
  const { loading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/?auth=login')
    }
  }, [loading, isAuthenticated, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-500">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">أدوات الدراسة</h1>
              <p className="text-sm text-gray-500">أسئلة تدريبية، بطاقات مراجعة، خطط دراسة وأكثر</p>
            </div>
          </div>
          <Button variant="ghost" onClick={() => router.push('/')} className="gap-2">
            <ArrowRight className="w-4 h-4" />
            الرئيسية
          </Button>
        </div>

        {/* Tools Panel */}
        <ToolsPanel />
      </div>
    </div>
  )
}
