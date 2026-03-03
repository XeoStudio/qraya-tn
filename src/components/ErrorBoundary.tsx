'use client'

import { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            حدث خطأ غير متوقع
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            نعتذر عن هذا الخطأ. يرجى تحديث الصفحة أو المحاولة لاحقاً.
          </p>
          <Button
            onClick={() => {
              this.setState({ hasError: false, error: undefined })
              window.location.reload()
            }}
          >
            تحديث الصفحة
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
