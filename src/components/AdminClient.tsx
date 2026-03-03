'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/lib/auth-context'
import AdminStats from './admin/AdminStats'
import AdminUsers from './admin/AdminUsers'
import AdminPromoCodes from './admin/AdminPromoCodes'
import AdminLogs from './admin/AdminLogs'
import AdminTickets from './admin/AdminTickets'
import AdminSubscriptions from './admin/AdminSubscriptions'
import AdminAdvancedStats from './admin/AdminAdvancedStats'
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
  Sparkles,
  Home,
  LogOut,
  Moon,
  Sun,
  Bell,
  Search,
  ChevronLeft,
  Settings,
  Shield,
  Zap
} from 'lucide-react'

interface StatsData {
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

export default function AdminClient() {
  const { user, loading, isAdmin, isAuthenticated, logout } = useAuth()
  const router = useRouter()
  
  const [activeTab, setActiveTab] = useState('stats')
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Check dark mode
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setDarkMode(isDark)
  }, [])

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/?auth=login')
      } else if (!isAdmin) {
        router.push('/')
      }
    }
  }, [loading, isAuthenticated, isAdmin, router])

  // Fetch stats
  const fetchStats = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin?action=stats', { credentials: 'include' })
      const data = await res.json()
      if (data.success) setStats(data.stats)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchStats()
    }
  }, [isAuthenticated, isAdmin, fetchStats])

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

  const showMessage = (type: 'success' | 'error', message: string) => {
    if (type === 'success') setSuccessMsg(message)
    else setErrorMsg(message)
  }

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark')
    setDarkMode(!darkMode)
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-slate-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-spin opacity-20" />
            <div className="absolute inset-2 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
              <Crown className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">جاري التحميل...</h2>
          <p className="text-gray-500 text-sm">تحميل لوحة الإدارة</p>
        </motion.div>
      </div>
    )
  }

  // Not authorized
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-slate-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <Shield className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">وصول مرفوض</h2>
          <p className="text-gray-500 mb-6">ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
          <Button onClick={() => router.push('/')} className="gap-2">
            <Home className="w-4 h-4" />
            العودة للرئيسية
          </Button>
        </motion.div>
      </div>
    )
  }

  const menuItems = [
    { 
      id: 'stats', 
      label: 'نظرة عامة', 
      icon: BarChart3, 
      color: 'text-blue-500',
      gradient: 'from-blue-500 to-cyan-500',
      description: 'إحصائيات المنصة'
    },
    { 
      id: 'advanced-stats', 
      label: 'إحصائيات متقدمة', 
      icon: TrendingUp, 
      color: 'text-emerald-500',
      gradient: 'from-emerald-500 to-teal-500',
      description: 'تحليلات تفصيلية'
    },
    { 
      id: 'users', 
      label: 'المستخدمين', 
      icon: Users, 
      color: 'text-violet-500',
      gradient: 'from-violet-500 to-purple-500',
      description: 'إدارة الحسابات'
    },
    { 
      id: 'subscriptions', 
      label: 'الاشتراكات', 
      icon: CreditCard, 
      color: 'text-amber-500',
      gradient: 'from-amber-500 to-orange-500',
      description: 'إدارة الاشتراكات'
    },
    { 
      id: 'tickets', 
      label: 'تذاكر الدعم', 
      icon: Ticket, 
      color: 'text-rose-500',
      gradient: 'from-rose-500 to-pink-500',
      description: 'طلبات الدعم'
    },
    { 
      id: 'promocodes', 
      label: 'أكواد الخصم', 
      icon: Sparkles, 
      color: 'text-pink-500',
      gradient: 'from-pink-500 to-fuchsia-500',
      description: 'إدارة العروض'
    },
    { 
      id: 'logs', 
      label: 'سجلات النشاط', 
      icon: FileText, 
      color: 'text-slate-500',
      gradient: 'from-slate-500 to-gray-500',
      description: 'سجل العمليات'
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-slate-950" dir="rtl">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Right Side - Logo & Menu */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white">لوحة الإدارة</h1>
                  <p className="text-xs text-gray-500">Qraya.tn Management</p>
                </div>
              </div>
            </div>

            {/* Center - Search */}
            <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="بحث..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 border-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
            </div>

            {/* Left Side - Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                className="rounded-xl"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl relative"
              >
                <Bell className="w-5 h-5" />
                {stats?.humanInterventionTickets && stats.humanInterventionTickets > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </Button>

              <div className="hidden sm:flex items-center gap-2 mr-2 pr-4 border-r border-gray-200 dark:border-gray-700">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
                  {user?.name?.[0] || 'A'}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name || 'المدير'}</p>
                  <p className="text-xs text-gray-500">Super Admin</p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Quick Stats Cards */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 p-4 text-white shadow-lg shadow-blue-500/20"
            >
              <div className="absolute top-0 left-0 w-20 h-20 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 opacity-80" />
                  <span className="text-sm opacity-80">إجمالي المستخدمين</span>
                </div>
                <p className="text-3xl font-bold">{stats.totalUsers.toLocaleString('ar-TN')}</p>
                <p className="text-xs opacity-70 mt-1">+{stats.recentSignups} هذا الأسبوع</p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 p-4 text-white shadow-lg shadow-emerald-500/20"
            >
              <div className="absolute top-0 left-0 w-20 h-20 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 opacity-80" />
                  <span className="text-sm opacity-80">المستخدمين النشطين</span>
                </div>
                <p className="text-3xl font-bold">{stats.activeUsers.toLocaleString('ar-TN')}</p>
                <p className="text-xs opacity-70 mt-1">{Math.round(stats.activeUsers / stats.totalUsers * 100)}% نسبة النشاط</p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 p-4 text-white shadow-lg shadow-violet-500/20"
            >
              <div className="absolute top-0 left-0 w-20 h-20 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-5 h-5 opacity-80" />
                  <span className="text-sm opacity-80">الاشتراكات النشطة</span>
                </div>
                <p className="text-3xl font-bold">{stats.activeSubscriptions.toLocaleString('ar-TN')}</p>
                <p className="text-xs opacity-70 mt-1">{stats.premiumUsers} مستخدم مميز</p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 p-4 text-white shadow-lg shadow-rose-500/20"
            >
              <div className="absolute top-0 left-0 w-20 h-20 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Ticket className="w-5 h-5 opacity-80" />
                  <span className="text-sm opacity-80">تذاكر تحتاج تدخل</span>
                </div>
                <p className="text-3xl font-bold">{stats.humanInterventionTickets}</p>
                <p className="text-xs opacity-70 mt-1">{stats.openTickets} تذكرة مفتوحة</p>
              </div>
              {stats.humanInterventionTickets > 0 && (
                <span className="absolute top-3 right-3 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </span>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Alert Messages */}
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Alert className="mb-4 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-emerald-700 dark:text-emerald-300">{successMsg}</AlertDescription>
              </Alert>
            </motion.div>
          )}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Alert className="mb-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700 dark:text-red-300">{errorMsg}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Layout */}
        <div className="flex gap-6">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <Card className="sticky top-24 p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-xl">
              <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">القائمة الرئيسية</h3>
                <p className="text-xs text-gray-400">اختر قسم للإدارة</p>
              </div>
              <nav className="space-y-1">
                {menuItems.map((item) => (
                  <motion.button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    whileHover={{ x: -4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right transition-all ${
                      activeTab === item.id
                        ? `bg-gradient-to-l ${item.gradient} text-white shadow-lg`
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      activeTab === item.id 
                        ? 'bg-white/20' 
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : item.color}`} />
                    </div>
                    <div className="flex-1">
                      <span className="block font-medium">{item.label}</span>
                      <span className={`text-xs ${activeTab === item.id ? 'text-white/70' : 'text-gray-400'}`}>
                        {item.description}
                      </span>
                    </div>
                    {activeTab === item.id && (
                      <ChevronLeft className="w-4 h-4" />
                    )}
                  </motion.button>
                ))}
              </nav>

              {/* Quick Actions */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => router.push('/')}
                >
                  <Home className="w-4 h-4" />
                  الرئيسية
                </Button>
              </div>
            </Card>
          </aside>

          {/* Sidebar - Mobile */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                onClick={() => setSidebarOpen(false)}
              >
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25 }}
                  className="absolute left-0 top-0 h-full w-80 bg-white dark:bg-gray-900 shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <Crown className="w-4 h-4 text-white" />
                      </div>
                      <h2 className="font-bold">لوحة التحكم</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                  <nav className="p-4 space-y-1">
                    {menuItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id)
                          setSidebarOpen(false)
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right transition-all ${
                          activeTab === item.id
                            ? `bg-gradient-to-l ${item.gradient} text-white`
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : item.color}`} />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    ))}
                  </nav>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {activeTab === 'stats' && (
                <motion.div
                  key="stats"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <AdminStats stats={stats} loading={isLoading} onRefresh={fetchStats} />
                </motion.div>
              )}

              {activeTab === 'advanced-stats' && (
                <motion.div
                  key="advanced-stats"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <AdminAdvancedStats />
                </motion.div>
              )}

              {activeTab === 'users' && (
                <motion.div
                  key="users"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <AdminUsers showMessage={showMessage} />
                </motion.div>
              )}

              {activeTab === 'subscriptions' && (
                <motion.div
                  key="subscriptions"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <AdminSubscriptions showMessage={showMessage} />
                </motion.div>
              )}

              {activeTab === 'tickets' && (
                <motion.div
                  key="tickets"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <AdminTickets showMessage={showMessage} />
                </motion.div>
              )}

              {activeTab === 'promocodes' && (
                <motion.div
                  key="promocodes"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <AdminPromoCodes showMessage={showMessage} />
                </motion.div>
              )}

              {activeTab === 'logs' && (
                <motion.div
                  key="logs"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <AdminLogs />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  )
}
