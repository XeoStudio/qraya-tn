import { Metadata } from 'next'
import TermsClient from './TermsClient'

export const metadata: Metadata = {
  title: 'شروط الاستخدام - مساعد دراسة تونسي',
  description: 'شروط الاستخدام لمنصة مساعد دراسة تونسي'
}

export default function TermsPage() {
  return <TermsClient />
}
