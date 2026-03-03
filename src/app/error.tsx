'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4" dir="rtl">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          حدث خطأ غير متوقع
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          نعتذر عن هذا الإزعاج. يرجى تحديث الصفحة أو العودة للصفحة الرئيسية.
        </p>
        
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-left">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono break-all">
              {error?.message || 'Unknown error'}
            </p>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            إعادة المحاولة
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/'} className="gap-2">
            <Home className="w-4 h-4" />
            الصفحة الرئيسية
          </Button>
        </div>
      </Card>
    </div>
  )
}
