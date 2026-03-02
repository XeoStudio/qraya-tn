import { Metadata } from 'next'
import PrivacyClient from './PrivacyClient'

export const metadata: Metadata = {
  title: 'سياسة الخصوصية - مساعد دراسة تونسي',
  description: 'سياسة الخصوصية لمنصة مساعد دراسة تونسي'
}

export default function PrivacyPage() {
  return <PrivacyClient />
}
