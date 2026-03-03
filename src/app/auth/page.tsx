'use client'

import { Suspense } from 'react'
import AuthContent from './AuthContent'

export default function AuthRoute() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">جاري التحميل...</div>
      </div>
    }>
      <AuthContent />
    </Suspense>
  )
}
