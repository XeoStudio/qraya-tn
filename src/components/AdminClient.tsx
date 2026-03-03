'use client'

import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { useRouter } from 'next/navigation'

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

// Icons as simple SVG components
const Icons = {
  Crown: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  Users: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Chart: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Card: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  Ticket: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  ),
  Sparkles: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  File: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  TrendingUp: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  Activity: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  Home: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Logout: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  Menu: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  X: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Refresh: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  Shield: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  Loader: () => (
    <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  ),
}

// Simple Button Component
function Button({ 
  children, 
  onClick, 
  variant = 'default', 
  size = 'md',
  disabled = false,
  className = ''
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'default' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  disabled?: boolean
  className?: string
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    default: 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 shadow-lg',
    outline: 'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800',
    ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800',
    danger: 'bg-red-500 text-white hover:bg-red-600'
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
    icon: 'p-2'
  }
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  )
}

// Simple Card Component
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  )
}

// Stats Card Component
function StatCard({ 
  title, 
  value, 
  subtitle, 
  color,
  icon: Icon
}: { 
  title: string
  value: number
  subtitle?: string
  color: string
  icon: React.FC
}) {
  const gradients: Record<string, string> = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-emerald-500 to-teal-500',
    purple: 'from-violet-500 to-purple-500',
    red: 'from-rose-500 to-pink-500',
    amber: 'from-amber-500 to-orange-500',
  }
  
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradients[color]} p-5 text-white shadow-lg`}>
      <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-2 opacity-90">
          <Icon />
          <span className="text-sm">{title}</span>
        </div>
        <p className="text-3xl font-bold">{value.toLocaleString('ar-TN')}</p>
        {subtitle && <p className="text-xs opacity-75 mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}

// Menu Item Component
function MenuItem({
  id,
  label,
  description,
  icon: Icon,
  color,
  active,
  onClick
}: {
  id: string
  label: string
  description: string
  icon: React.FC
  color: string
  active: boolean
  onClick: () => void
}) {
  const colors: Record<string, string> = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-emerald-500 to-teal-500',
    purple: 'from-violet-500 to-purple-500',
    amber: 'from-amber-500 to-orange-500',
    red: 'from-rose-500 to-pink-500',
    pink: 'from-pink-500 to-fuchsia-500',
    gray: 'from-slate-500 to-gray-500',
  }
  
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right transition-all duration-200 ${
        active
          ? `bg-gradient-to-l ${colors[color]} text-white shadow-lg`
          : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
      }`}
    >
      <div className={`p-2 rounded-lg ${active ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'}`}>
        <span className={active ? 'text-white' : `text-${color}-500`}>
          <Icon />
        </span>
      </div>
      <div className="flex-1">
        <span className="block font-medium">{label}</span>
        <span className={`text-xs ${active ? 'text-white/70' : 'text-gray-400'}`}>
          {description}
        </span>
      </div>
    </button>
  )
}

// Main Admin Component
export default function AdminClient() {
  const router = useRouter()
  
  // State
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [activeTab, setActiveTab] = useState('stats')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
          <div className="text-purple-500 mx-auto mb-4">
            <Icons.Loader />
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
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500">
            <Icons.Shield />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">وصول مرفوض</h2>
          <p className="text-gray-500 mb-6">ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
          <Button onClick={() => router.push('/')}>
            <Icons.Home />
            العودة للرئيسية
          </Button>
        </div>
      </div>
    )
  }

  // Menu items
  const menuItems = [
    { id: 'stats', label: 'نظرة عامة', description: 'إحصائيات المنصة', icon: Icons.Chart, color: 'blue' },
    { id: 'advanced-stats', label: 'إحصائيات متقدمة', description: 'تحليلات تفصيلية', icon: Icons.TrendingUp, color: 'green' },
    { id: 'users', label: 'المستخدمين', description: 'إدارة الحسابات', icon: Icons.Users, color: 'purple' },
    { id: 'subscriptions', label: 'الاشتراكات', description: 'إدارة الاشتراكات', icon: Icons.Card, color: 'amber' },
    { id: 'tickets', label: 'تذاكر الدعم', description: 'طلبات الدعم', icon: Icons.Ticket, color: 'red' },
    { id: 'promocodes', label: 'أكواد الخصم', description: 'إدارة العروض', icon: Icons.Sparkles, color: 'pink' },
    { id: 'logs', label: 'سجلات النشاط', description: 'سجل العمليات', icon: Icons.File, color: 'gray' },
  ]

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'stats':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span className="text-blue-500"><Icons.Chart /></span>
                نظرة عامة
              </h3>
              <Button variant="outline" size="sm" onClick={fetchStats}>
                <Icons.Refresh />
                تحديث
              </Button>
            </div>
            
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard
                  title="إجمالي المستخدمين"
                  value={stats.totalUsers}
                  subtitle={`+${stats.recentSignups} هذا الأسبوع`}
                  color="blue"
                  icon={Icons.Users}
                />
                <StatCard
                  title="المستخدمين النشطين"
                  value={stats.activeUsers}
                  subtitle={`${Math.round(stats.activeUsers / stats.totalUsers * 100)}% نسبة النشاط`}
                  color="green"
                  icon={Icons.Activity}
                />
                <StatCard
                  title="الاشتراكات النشطة"
                  value={stats.activeSubscriptions}
                  subtitle={`${stats.premiumUsers} مستخدم مميز`}
                  color="purple"
                  icon={Icons.Crown}
                />
                <StatCard
                  title="تذاكر تحتاج تدخل"
                  value={stats.humanInterventionTickets}
                  subtitle={`${stats.openTickets} تذكرة مفتوحة`}
                  color="red"
                  icon={Icons.Ticket}
                />
              </div>
            )}

            <Card className="p-6">
              <h4 className="font-semibold mb-4">إجراءات سريعة</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Button variant="outline" onClick={() => setActiveTab('users')}>
                  <Icons.Users />
                  إدارة المستخدمين
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('tickets')}>
                  <Icons.Ticket />
                  التذاكر المعلقة
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('subscriptions')}>
                  <Icons.Card />
                  الاشتراكات
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('promocodes')}>
                  <Icons.Sparkles />
                  أكواد الخصم
                </Button>
              </div>
            </Card>
          </div>
        )
      
      case 'users':
        return (
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-purple-500"><Icons.Users /></span>
              إدارة المستخدمين
            </h3>
            <p className="text-gray-500">قريباً - جاري التطوير...</p>
          </Card>
        )
      
      case 'subscriptions':
        return (
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-amber-500"><Icons.Card /></span>
              إدارة الاشتراكات
            </h3>
            <p className="text-gray-500">قريباً - جاري التطوير...</p>
          </Card>
        )
      
      case 'tickets':
        return (
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-red-500"><Icons.Ticket /></span>
              تذاكر الدعم
            </h3>
            <p className="text-gray-500">قريباً - جاري التطوير...</p>
          </Card>
        )
      
      case 'promocodes':
        return (
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-pink-500"><Icons.Sparkles /></span>
              أكواد الخصم
            </h3>
            <p className="text-gray-500">قريباً - جاري التطوير...</p>
          </Card>
        )
      
      case 'logs':
        return (
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-gray-500"><Icons.File /></span>
              سجلات النشاط
            </h3>
            <p className="text-gray-500">قريباً - جاري التطوير...</p>
          </Card>
        )
      
      case 'advanced-stats':
        return (
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-green-500"><Icons.TrendingUp /></span>
              إحصائيات متقدمة
            </h3>
            <p className="text-gray-500">قريباً - جاري التطوير...</p>
          </Card>
        )
      
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
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Icons.Menu />
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg text-white">
                  <Icons.Crown />
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

              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/')}
              >
                <Icons.Home />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-red-500 hover:text-red-600"
              >
                <Icons.Logout />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <Card className="sticky top-24 p-4">
              <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">القائمة الرئيسية</h3>
                <p className="text-xs text-gray-400">اختر قسم للإدارة</p>
              </div>
              <nav className="space-y-1">
                {menuItems.map((item) => (
                  <MenuItem
                    key={item.id}
                    {...item}
                    active={activeTab === item.id}
                    onClick={() => setActiveTab(item.id)}
                  />
                ))}
              </nav>
            </Card>
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
                      <Icons.Crown />
                    </div>
                    <h2 className="font-bold">لوحة التحكم</h2>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                    <Icons.X />
                  </Button>
                </div>
                <nav className="space-y-1">
                  {menuItems.map((item) => (
                    <MenuItem
                      key={item.id}
                      {...item}
                      active={activeTab === item.id}
                      onClick={() => {
                        setActiveTab(item.id)
                        setSidebarOpen(false)
                      }}
                    />
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
