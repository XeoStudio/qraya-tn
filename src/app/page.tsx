'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import HeroSection from '@/components/HeroSection'
import QuickActions from '@/components/QuickActions'
import PricingSection from '@/components/PricingSection'
import AuthModal from '@/components/AuthModal'
import UserDashboard from '@/components/UserDashboard'
import AdminPage from '@/components/AdminPage'
import ChatInterface from '@/components/ChatInterface'
import ToolsPanel from '@/components/ToolsPanel'
import WhatsAppButton from '@/components/WhatsAppButton'
import ErrorBoundary from '@/components/ErrorBoundary'
import { Button } from '@/components/ui/button'
import { 
  BookOpen, 
  Menu, 
  X, 
  LogOut, 
  Settings, 
  Crown,
  MessageCircle,
  Sparkles
} from 'lucide-react'

type View = 'home' | 'chat' | 'tools' | 'dashboard' | 'admin'

function MainContent() {
  const { user, loading, isAuthenticated, isAdmin, logout } = useAuth()
  const [currentView, setCurrentView] = useState<View>('home')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleGetStarted = () => {
    if (isAuthenticated) {
      setCurrentView('chat')
    } else {
      setAuthMode('register')
      setShowAuthModal(true)
    }
  }

  const handleShowPricing = () => {
    setCurrentView('home')
    setTimeout(() => {
      const pricingSection = document.getElementById('pricing')
      if (pricingSection) {
        pricingSection.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  const handleQuickAction = (action: string) => {
    if (action === 'login') {
      setAuthMode('login')
      setShowAuthModal(true)
    } else {
      setCurrentView('tools')
    }
  }

  const handleWhatsAppContact = () => {
    const message = 'مرحباً، أريد الاستفسار عن خطط الاشتراك في مساعد دراسة تونسي'
    const phoneNumber = '21624239724'
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900" dir="rtl">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button
              onClick={() => setCurrentView('home')}
              className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="hidden sm:inline">مساعد دراسة تونسي</span>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  <Button
                    variant={currentView === 'chat' ? 'default' : 'ghost'}
                    onClick={() => setCurrentView('chat')}
                    className="gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    المحادثة
                  </Button>
                  <Button
                    variant={currentView === 'tools' ? 'default' : 'ghost'}
                    onClick={() => setCurrentView('tools')}
                    className="gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    الأدوات
                  </Button>
                  {isAdmin && (
                    <Button
                      variant={currentView === 'admin' ? 'default' : 'ghost'}
                      onClick={() => setCurrentView('admin')}
                      className="gap-2"
                    >
                      <Crown className="w-4 h-4" />
                      الإدارة
                    </Button>
                  )}
                  <Button
                    variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                    onClick={() => setCurrentView('dashboard')}
                    className="gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    حسابي
                  </Button>
                  <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-2" />
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {user?.name || 'مستخدم'}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={logout}>
                    <LogOut className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => { setAuthMode('login'); setShowAuthModal(true) }}
                  >
                    تسجيل الدخول
                  </Button>
                  <Button
                    onClick={() => { setAuthMode('register'); setShowAuthModal(true) }}
                    className="bg-gradient-to-r from-blue-600 to-purple-600"
                  >
                    إنشاء حساب
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden border-t py-4"
              >
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <Button
                      variant={currentView === 'chat' ? 'default' : 'ghost'}
                      onClick={() => { setCurrentView('chat'); setMobileMenuOpen(false) }}
                      className="w-full justify-start gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      المحادثة
                    </Button>
                    <Button
                      variant={currentView === 'tools' ? 'default' : 'ghost'}
                      onClick={() => { setCurrentView('tools'); setMobileMenuOpen(false) }}
                      className="w-full justify-start gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      الأدوات
                    </Button>
                    {isAdmin && (
                      <Button
                        variant={currentView === 'admin' ? 'default' : 'ghost'}
                        onClick={() => { setCurrentView('admin'); setMobileMenuOpen(false) }}
                        className="w-full justify-start gap-2"
                      >
                        <Crown className="w-4 h-4" />
                        الإدارة
                      </Button>
                    )}
                    <Button
                      variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                      onClick={() => { setCurrentView('dashboard'); setMobileMenuOpen(false) }}
                      className="w-full justify-start gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      حسابي
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => { logout(); setMobileMenuOpen(false) }}
                      className="w-full justify-start gap-2 text-red-500"
                    >
                      <LogOut className="w-4 h-4" />
                      تسجيل الخروج
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      onClick={() => { setAuthMode('login'); setShowAuthModal(true); setMobileMenuOpen(false) }}
                      className="w-full"
                    >
                      تسجيل الدخول
                    </Button>
                    <Button
                      onClick={() => { setAuthMode('register'); setShowAuthModal(true); setMobileMenuOpen(false) }}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                    >
                      إنشاء حساب
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16">
        <AnimatePresence mode="wait">
          {currentView === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <HeroSection
                onGetStarted={handleGetStarted}
                onShowPricing={handleShowPricing}
                isAuthenticated={isAuthenticated}
              />
              <QuickActions
                onAction={handleQuickAction}
                isAuthenticated={isAuthenticated}
              />
              <PricingSection onContact={handleWhatsAppContact} />
              
              {/* Footer */}
              <footer className="py-12 bg-gray-900 text-white">
                <div className="container mx-auto px-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    {/* Brand */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <BookOpen className="w-6 h-6" />
                        <span className="font-bold text-lg">مساعد دراسة تونسي</span>
                      </div>
                      <p className="text-sm text-gray-400 leading-relaxed">
                        منصة تعليمية ذكية للطلاب التونسيين. نساعدك في فهم الدروس، التلخيص، والمراجعة.
                      </p>
                    </div>
                    
                    {/* Quick Links */}
                    <div>
                      <h4 className="font-semibold mb-4">روابط سريعة</h4>
                      <ul className="space-y-2 text-sm text-gray-400">
                        <li>
                          <button onClick={handleGetStarted} className="hover:text-white transition-colors">
                            ابدأ المحادثة
                          </button>
                        </li>
                        <li>
                          <button onClick={handleShowPricing} className="hover:text-white transition-colors">
                            خطط الاشتراك
                          </button>
                        </li>
                        <li>
                          <a href="/support" className="hover:text-white transition-colors">
                            الدعم الفني
                          </a>
                        </li>
                      </ul>
                    </div>
                    
                    {/* Legal */}
                    <div>
                      <h4 className="font-semibold mb-4">القانونية</h4>
                      <ul className="space-y-2 text-sm text-gray-400">
                        <li>
                          <a href="/privacy" className="hover:text-white transition-colors">
                            سياسة الخصوصية
                          </a>
                        </li>
                        <li>
                          <a href="/terms" className="hover:text-white transition-colors">
                            شروط الاستخدام
                          </a>
                        </li>
                      </ul>
                    </div>
                    
                    {/* Contact */}
                    <div>
                      <h4 className="font-semibold mb-4">تواصل معنا</h4>
                      <ul className="space-y-2 text-sm text-gray-400">
                        <li className="flex items-center gap-2">
                          <span>واتساب:</span>
                          <a 
                            href="https://wa.me/21624239724" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:text-green-400 transition-colors"
                            dir="ltr"
                          >
                            +216 24 239 724
                          </a>
                        </li>
                        <li className="flex items-center gap-2">
                          <span>البريد:</span>
                          <a 
                            href="mailto:wissemlahkiri2@gmail.com"
                            className="hover:text-blue-400 transition-colors"
                            dir="ltr"
                          >
                            wissemlahkiri2@gmail.com
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-gray-400">
                      © 2025 جميع الحقوق محفوظة - Wissem Lahkiri
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>🇹🇳 صنع في تونس</span>
                    </div>
                  </div>
                </div>
              </footer>
            </motion.div>
          )}

          {currentView === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="container mx-auto px-4 py-8"
            >
              <ErrorBoundary>
                <ChatInterface />
              </ErrorBoundary>
            </motion.div>
          )}

          {currentView === 'tools' && (
            <motion.div
              key="tools"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="container mx-auto px-4 py-8"
            >
              <h1 className="text-2xl font-bold mb-6 text-center">أدوات الدراسة</h1>
              <ErrorBoundary>
                <ToolsPanel />
              </ErrorBoundary>
            </motion.div>
          )}

          {currentView === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="container mx-auto px-4 py-8"
            >
              <ErrorBoundary>
                <UserDashboard onShowPricing={handleShowPricing} />
              </ErrorBoundary>
            </motion.div>
          )}

          {currentView === 'admin' && isAdmin && (
            <motion.div
              key="admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="container mx-auto px-4 py-8"
            >
              <ErrorBoundary>
                <AdminPage />
              </ErrorBoundary>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />

      {/* WhatsApp Button */}
      <WhatsAppButton />
    </div>
  )
}

export default function Home() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <MainContent />
      </ErrorBoundary>
    </AuthProvider>
  )
}
