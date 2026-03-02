'use client'

import { AuthProvider } from '@/lib/auth-context'
import SupportContent from './SupportContent'

export default function SupportPage() {
  return (
    <AuthProvider>
      <SupportContent />
    </AuthProvider>
  )
}
