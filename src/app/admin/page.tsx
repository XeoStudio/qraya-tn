'use client'

import dynamic from 'next/dynamic'
import { Loader2, Crown } from 'lucide-react'

// Dynamically import AdminClient with SSR disabled
const AdminClient = dynamic(() => import('@/components/AdminClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-spin opacity-20" />
          <div className="absolute inset-2 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
            <Crown className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">جاري التحميل...</h2>
        <p className="text-gray-500 text-sm">تحميل لوحة الإدارة</p>
      </div>
    </div>
  )
})

export default function AdminPage() {
  return <AdminClient />
}
