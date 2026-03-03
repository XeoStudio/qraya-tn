'use client'

import dynamic from 'next/dynamic'

// Loading component
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 animate-spin opacity-20" />
        <div className="w-12 h-12 mx-auto mb-4 -mt-14 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center shadow-lg">
          <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">جاري التحميل...</h2>
        <p className="text-gray-500 text-sm">تحميل لوحة الإدارة</p>
      </div>
    </div>
  )
}

// Dynamic import with SSR disabled - this prevents the AuthProvider error during prerendering
const AdminClient = dynamic(() => import('@/components/AdminClient'), {
  ssr: false,
  loading: LoadingScreen
})

export default function AdminPage() {
  return <AdminClient />
}
