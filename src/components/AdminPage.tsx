'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users, 
  Ticket, 
  FileText, 
  BarChart3,
  Loader2,
  Crown,
  CheckCircle2,
  XCircle,
  CreditCard,
  Menu,
  X,
  TrendingUp,
  Activity,
  Sparkles
} from 'lucide-react'
import dynamic from 'next/dynamic'

// Lazy load heavy components
const AdminStats = dynamic(() => import('./admin/AdminStats'), { 
  loading: () => <LoadingSpinner />,
  ssr: false 
})
const AdminUsers = dynamic(() => import('./admin/AdminUsers'), { 
  loading: () => <LoadingSpinner />,
  ssr: false 
})
const AdminPromoCodes = dynamic(() => import('./admin/AdminPromoCodes'), { 
  loading: () => <LoadingSpinner />,
  ssr: false 
})
const AdminLogs = dynamic(() => import('./admin/AdminLogs'), { 
  loading: () => <LoadingSpinner />,
  ssr: false 
})
const AdminTickets = dynamic(() => import('./admin/AdminTickets'), { 
  loading: () => <LoadingSpinner />,
  ssr: false 
})
const AdminSubscriptions = dynamic(() => import('./admin/AdminSubscriptions'), { 
  loading: () => <LoadingSpinner />,
  ssr: false 
})
const AdminAdvancedStats = dynamic(() => import('./admin/AdminAdvancedStats'), { 
  loading: () => <LoadingSpinner />,
  ssr: false 
})

function LoadingSpinner() {
  return (
    <Card className="p-8">
      <div className="flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    </Card>
  )
}

interface AdminStatsData {
  totalUsers: number
  activeUsers: number
  premiumUsers: number
  bannedUsers: number
  totalChats: number
  totalPromoCodes: number
  activeSubscriptions: number
  recentSignups: number
  openTickets: number
  humanInterventionTickets: number
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('stats')
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // Messages
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  // Stats
  const [stats, setStats] = useState<AdminStatsData | null>(null)

  // Auto-hide messages
  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg(null)
        setErrorMsg(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [successMsg, errorMsg])

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin?action=stats', { credentials: 'include' })
      if (!res.ok) {
        throw new Error('Failed to fetch stats')
      }
      const data = await res.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'stats') {
      fetchStats()
    }
  }, [activeTab, fetchStats])

  const showMessage = (type: 'success' | 'error', message: string) => {
    if (type === 'success') setSuccessMsg(message)
    else setErrorMsg(message)
  }

  const menuItems = [
    { id: 'stats', label: 'نظرة عامة', icon: BarChart3, color: 'text-blue-500' },
    { id: 'advanced-stats', label: 'إحصائيات متقدمة', icon: TrendingUp, color: 'text-green-500' },
    { id: 'users', label: 'المستخدمين', icon: Users, color: 'text-purple-500' },
    { id: 'subscriptions', label: 'الاشتراكات', icon: CreditCard, color: 'text-amber-500' },
    { id: 'tickets', label: 'تذاكر الدعم', icon: Ticket, color: 'text-orange-500' },
    { id: 'promocodes', label: 'أكواد الخصم', icon: Sparkles, color: 'text-pink-500' },
    { id: 'logs', label: 'سجلات النشاط', icon: FileText, color: 'text-gray-500' },
  ]

  const renderContent = () => {
    try {
      switch (activeTab) {
        case 'stats':
          return <AdminStats stats={stats} loading={loading} onRefresh={fetchStats} />
        case 'advanced-stats':
          return <AdminAdvancedStats />
        case 'users':
          return <AdminUsers showMessage={showMessage} />
        case 'subscriptions':
          return <AdminSubscriptions showMessage={showMessage} />
        case 'tickets':
          return <AdminTickets showMessage={showMessage} />
        case 'promocodes':
          return <AdminPromoCodes showMessage={showMessage} />
        case 'logs':
          return <AdminLogs />
        default:
          return <AdminStats stats={stats} loading={loading} onRefresh={fetchStats} />
      }
    } catch (error) {
      console.error('Error rendering content:', error)
      return (
        <Card className="p-8 text-center">
          <p className="text-red-500">حدث خطأ في تحميل المحتوى</p>
          <Button onClick={() => setActiveTab('stats')} variant="outline" className="mt-4">
            العودة للرئيسية
          </Button>
        </Card>
      )
    }
  }

  return (
    <div className="w-full min-h-screen">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between mb-4 p-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <div className="flex items-center gap-2">
          <Crown className="w-6 h-6 text-purple-500" />
          <h2 className="text-lg font-bold">لوحة التحكم</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Quick Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-3 text-white">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 opacity-80" />
              <span className="text-2xl font-bold">{stats.totalUsers}</span>
            </div>
            <p className="text-xs opacity-80 mt-1">إجمالي المستخدمين</p>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-3 text-white">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 opacity-80" />
              <span className="text-2xl font-bold">{stats.activeUsers}</span>
            </div>
            <p className="text-xs opacity-80 mt-1">المستخدمين النشطين</p>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-3 text-white">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 opacity-80" />
              <span className="text-2xl font-bold">{stats.activeSubscriptions}</span>
            </div>
            <p className="text-xs opacity-80 mt-1">الاشتراكات النشطة</p>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-3 text-white relative">
            <div className="flex items-center gap-2">
              <Ticket className="w-5 h-5 opacity-80" />
              <span className="text-2xl font-bold">{stats.humanInterventionTickets}</span>
            </div>
            <p className="text-xs opacity-80 mt-1">تذاكر تحتاج تدخل</p>
            {stats.humanInterventionTickets > 0 && (
              <span className="absolute top-1 left-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            )}
          </div>
        </div>
      )}

      <div className="flex gap-4">
        {/* Sidebar - Desktop */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <Card className="p-2 sticky top-20">
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right transition-all ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : item.color}`} />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Sidebar - Mobile */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 z-50 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          >
            <div
              className="w-64 h-full bg-white dark:bg-gray-800 p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-6 h-6 text-purple-500" />
                <h2 className="text-lg font-bold">لوحة التحكم</h2>
              </div>
              <nav className="space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id)
                      setSidebarOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right transition-all ${
                      activeTab === item.id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : item.color}`} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Messages */}
          {successMsg && (
            <Alert className="mb-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 dark:text-green-300">{successMsg}</AlertDescription>
            </Alert>
          )}
          {errorMsg && (
            <Alert className="mb-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700 dark:text-red-300">{errorMsg}</AlertDescription>
            </Alert>
          )}

          {/* Tab Content */}
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
