'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// Import existing admin components
import AdminUsers from './admin/AdminUsers'
import AdminPromoCodes from './admin/AdminPromoCodes'
import AdminLogs from './admin/AdminLogs'
import AdminTickets from './admin/AdminTickets'
import AdminSubscriptions from './admin/AdminSubscriptions'
import AdminAdvancedStats from './admin/AdminAdvancedStats'

// Types
interface User {
  id: string
  email: string
  name: string | null
  role: 'USER' | 'PREMIUM' | 'ADMIN'
  status: 'ACTIVE' | 'BANNED' | 'INACTIVE'
}

interface Stats {
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

// Main Component
export default function AdminClient() {
  const router = useRouter()
  
  // State
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [activeTab, setActiveTab] = useState('stats')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Mount check
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch user
  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth', {
        method: 'GET',
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin?action=stats', { credentials: 'include' })
      const data = await res.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch {
      console.error('Failed to fetch stats')
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    if (mounted) {
      fetchUser()
    }
  }, [mounted, fetchUser])

  // Redirect logic
  useEffect(() => {
    if (!loading && mounted) {
      if (!user) {
        router.push('/?auth=login')
      } else if (user.role !== 'ADMIN') {
        router.push('/')
      } else {
        fetchStats()
      }
    }
  }, [loading, user, mounted, router, fetchStats])

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

  // Show message helper
  const showMessage = (type: 'success' | 'error', message: string) => {
    if (type === 'success') setSuccessMsg(message)
    else setErrorMsg(message)
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
        credentials: 'include'
      })
    } catch {
      // ignore
    }
    router.push('/')
  }

  // Not mounted yet
  if (!mounted) {
    return null
  }

  // Loading state
  if (loading) {
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

  // Not authorized
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-slate-950 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">وصول مرفوض</h2>
          <p className="text-gray-500 mb-6">ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium hover:from-purple-600 hover:to-blue-600 shadow-lg"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    )
  }

  // Menu items
  const menuItems = [
    { 
      id: 'stats', 
      label: 'نظرة عامة', 
      description: 'إحصائيات المنصة',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'blue'
    },
    { 
      id: 'advanced-stats', 
      label: 'إحصائيات متقدمة', 
      description: 'تحليلات تفصيلية',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: 'green'
    },
    { 
      id: 'users', 
      label: 'المستخدمين', 
      description: 'إدارة الحسابات',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      color: 'purple'
    },
    { 
      id: 'subscriptions', 
      label: 'الاشتراكات', 
      description: 'إدارة الاشتراكات',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      color: 'amber'
    },
    { 
      id: 'tickets', 
      label: 'تذاكر الدعم', 
      description: 'طلبات الدعم',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      ),
      color: 'red'
    },
    { 
      id: 'promocodes', 
      label: 'أكواد الخصم', 
      description: 'إدارة العروض',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      color: 'pink'
    },
    { 
      id: 'logs', 
      label: 'سجلات النشاط', 
      description: 'سجل العمليات',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'gray'
    },
  ]

  const colors: Record<string, { gradient: string; text: string }> = {
    blue: { gradient: 'from-blue-500 to-cyan-500', text: 'text-blue-500' },
    green: { gradient: 'from-emerald-500 to-teal-500', text: 'text-emerald-500' },
    purple: { gradient: 'from-violet-500 to-purple-500', text: 'text-violet-500' },
    amber: { gradient: 'from-amber-500 to-orange-500', text: 'text-amber-500' },
    red: { gradient: 'from-rose-500 to-pink-500', text: 'text-rose-500' },
    pink: { gradient: 'from-pink-500 to-fuchsia-500', text: 'text-pink-500' },
    gray: { gradient: 'from-slate-500 to-gray-500', text: 'text-slate-500' },
  }

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'stats':
        return <StatsTab stats={stats} onRefresh={fetchStats} />
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
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-slate-950" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Right Side */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white">لوحة الإدارة</h1>
                  <p className="text-xs text-gray-500">Qraya.tn Management</p>
                </div>
              </div>
            </div>

            {/* Left Side */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 mr-2 pr-4 border-r border-gray-200 dark:border-gray-700">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
                  {user.name?.[0] || 'A'}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name || 'المدير'}</p>
                  <p className="text-xs text-gray-500">Super Admin</p>
                </div>
              </div>

              <button
                onClick={() => router.push('/')}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>
              
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Alert Messages */}
      {(successMsg || errorMsg) && (
        <div className="container mx-auto px-4 mt-4">
          {successMsg && (
            <div className="mb-2 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="mb-2 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              {errorMsg}
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">القائمة الرئيسية</h3>
                <p className="text-xs text-gray-400">اختر قسم للإدارة</p>
              </div>
              <nav className="space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right transition-all duration-200 ${
                      activeTab === item.id
                        ? `bg-gradient-to-l ${colors[item.color].gradient} text-white shadow-lg`
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      activeTab === item.id ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <span className={activeTab === item.id ? 'text-white' : colors[item.color].text}>
                        {item.icon}
                      </span>
                    </div>
                    <div className="flex-1">
                      <span className="block font-medium">{item.label}</span>
                      <span className={`text-xs ${activeTab === item.id ? 'text-white/70' : 'text-gray-400'}`}>
                        {item.description}
                      </span>
                    </div>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Sidebar - Mobile */}
          {sidebarOpen && (
            <div 
              className="lg:hidden fixed inset-0 z-50 bg-black/50"
              onClick={() => setSidebarOpen(false)}
            >
              <div 
                className="absolute left-0 top-0 h-full w-80 bg-white dark:bg-gray-900 shadow-2xl p-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                      </svg>
                    </div>
                    <h2 className="font-bold">لوحة التحكم</h2>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
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
                          ? `bg-gradient-to-l ${colors[item.color].gradient} text-white`
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span className={activeTab === item.id ? 'text-white' : colors[item.color].text}>
                        {item.icon}
                      </span>
                      <span className="font-medium">{item.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  )
}

// Stats Tab Component
function StatsTab({ stats, onRefresh }: { stats: Stats | null; onRefresh: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          نظرة عامة
        </h3>
        <button
          onClick={onRefresh}
          className="px-4 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          تحديث
        </button>
      </div>
      
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            title="إجمالي المستخدمين"
            value={stats.totalUsers}
            subtitle={`+${stats.recentSignups} هذا الأسبوع`}
            color="blue"
            icon="users"
          />
          <StatCard
            title="المستخدمين النشطين"
            value={stats.activeUsers}
            subtitle={stats.totalUsers > 0 ? `${Math.round(stats.activeUsers / stats.totalUsers * 100)}% نسبة النشاط` : '0% نسبة النشاط'}
            color="green"
            icon="activity"
          />
          <StatCard
            title="الاشتراكات النشطة"
            value={stats.activeSubscriptions}
            subtitle={`${stats.premiumUsers} مستخدم مميز`}
            color="purple"
            icon="crown"
          />
          <StatCard
            title="تذاكر تحتاج تدخل"
            value={stats.humanInterventionTickets}
            subtitle={`${stats.openTickets} تذكرة مفتوحة`}
            color="red"
            icon="ticket"
          />
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="font-semibold mb-4">إجراءات سريعة</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction
            icon="users"
            label="إدارة المستخدمين"
            color="purple"
          />
          <QuickAction
            icon="ticket"
            label="التذاكر المعلقة"
            color="red"
          />
          <QuickAction
            icon="card"
            label="الاشتراكات"
            color="amber"
          />
          <QuickAction
            icon="sparkles"
            label="أكواد الخصم"
            color="pink"
          />
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({ 
  title, value, subtitle, color, icon
}: { 
  title: string
  value: number
  subtitle?: string
  color: string
  icon: string
}) {
  const gradients: Record<string, string> = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-emerald-500 to-teal-500',
    purple: 'from-violet-500 to-purple-500',
    red: 'from-rose-500 to-pink-500',
    amber: 'from-amber-500 to-orange-500',
  }

  const icons: Record<string, JSX.Element> = {
    users: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    activity: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    crown: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
    ticket: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
    ),
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradients[color]} p-5 text-white shadow-lg`}>
      <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-2 opacity-90">
          {icons[icon]}
          <span className="text-sm">{title}</span>
        </div>
        <p className="text-3xl font-bold">{value.toLocaleString('ar-TN')}</p>
        {subtitle && <p className="text-xs opacity-75 mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}

// Quick Action Component  
function QuickAction({ icon, label, color }: { icon: string; label: string; color: string }) {
  const colors: Record<string, string> = {
    purple: 'text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20',
    red: 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20',
    amber: 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20',
    pink: 'text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20',
  }

  const icons: Record<string, JSX.Element> = {
    users: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    ticket: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
    ),
    card: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    sparkles: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  }

  return (
    <button className={`flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 transition-all ${colors[color]}`}>
      {icons[icon]}
      <span className="text-sm font-medium">{label}</span>
    </button>
  )
}
