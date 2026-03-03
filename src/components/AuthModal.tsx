'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Loader2, Mail, Lock, User, GraduationCap, MapPin, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth, RegisterData } from '@/lib/auth-context'
import { TUNISIAN_GOVERNORATES, YEARS_BY_LEVEL, SECTIONS_BY_LEVEL, STUDY_LEVELS } from '@/lib/constants'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'register'
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showExtraFields, setShowExtraFields] = useState(false)

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register form state
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerName, setRegisterName] = useState('')
  const [registerLevel, setRegisterLevel] = useState('')
  const [registerYear, setRegisterYear] = useState('')
  const [registerSection, setRegisterSection] = useState('')
  const [registerGovernorate, setRegisterGovernorate] = useState('')

  // Reset extra fields when level changes
  useEffect(() => {
    setRegisterYear('')
    setRegisterSection('')
  }, [registerLevel])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await login(loginEmail, loginPassword)
      if (result.success) {
        onClose()
        resetForms()
      } else {
        setError(result.error || 'فشل تسجيل الدخول')
      }
    } catch {
      setError('حدث خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const data: RegisterData & { governorate?: string } = {
        email: registerEmail,
        password: registerPassword,
        name: registerName
      }

      if (registerLevel) data.level = registerLevel
      if (registerYear) data.year = registerYear
      if (registerSection) data.section = registerSection
      if (registerGovernorate) data.governorate = registerGovernorate

      const result = await register(data)
      if (result.success) {
        onClose()
        resetForms()
      } else {
        setError(result.error || 'فشل إنشاء الحساب')
      }
    } catch {
      setError('حدث خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const resetForms = () => {
    setLoginEmail('')
    setLoginPassword('')
    setRegisterEmail('')
    setRegisterPassword('')
    setRegisterName('')
    setRegisterLevel('')
    setRegisterYear('')
    setRegisterSection('')
    setRegisterGovernorate('')
    setShowExtraFields(false)
    setError(null)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose()
      resetForms()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 border-0 shadow-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            مرحباً بك
          </DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-gray-400">
            سجل الدخول أو أنشئ حساباً جديداً
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => { setMode(v as 'login' | 'register'); setError(null) }}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
            <TabsTrigger value="register">إنشاء حساب</TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">البريد الإلكتروني</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="example@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="pr-10"
                    required
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">كلمة المرور</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="pr-10"
                    required
                    dir="ltr"
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-lg"
                >
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري تسجيل الدخول...
                  </>
                ) : (
                  'تسجيل الدخول'
                )}
              </Button>
            </form>
          </TabsContent>

          {/* Register Tab */}
          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4">
              {/* الحقول الأساسية */}
              <div className="space-y-2">
                <Label htmlFor="register-name">الاسم الكامل</Label>
                <div className="relative">
                  <User className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="أدخل اسمك"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    className="pr-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email">البريد الإلكتروني</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="example@email.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className="pr-10"
                    required
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password">كلمة المرور</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="6 أحرف على الأقل"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className="pr-10"
                    required
                    minLength={6}
                    dir="ltr"
                  />
                </div>
              </div>

              {/* الحقول الاختيارية القابلة للطي */}
              <Collapsible open={showExtraFields} onOpenChange={setShowExtraFields}>
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full flex items-center justify-between p-3 border rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <span className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5" />
                      المعلومات الدراسية (اختياري)
                    </span>
                    {showExtraFields ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  {/* الولاية */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      الولاية
                    </Label>
                    <Select value={registerGovernorate} onValueChange={setRegisterGovernorate}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="اختر الولاية" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {TUNISIAN_GOVERNORATES.map((gov) => (
                          <SelectItem key={gov.value} value={gov.value}>
                            {gov.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* المستوى الدراسي */}
                  <div className="space-y-2">
                    <Label>المستوى الدراسي</Label>
                    <Select value={registerLevel} onValueChange={setRegisterLevel}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المستوى الدراسي" />
                      </SelectTrigger>
                      <SelectContent>
                        {STUDY_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* السنة */}
                  {registerLevel && YEARS_BY_LEVEL[registerLevel]?.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <Label>السنة</Label>
                      <Select value={registerYear} onValueChange={setRegisterYear}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر السنة" />
                        </SelectTrigger>
                        <SelectContent>
                          {YEARS_BY_LEVEL[registerLevel].map((year) => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </motion.div>
                  )}

                  {/* الشعبة */}
                  {registerLevel && SECTIONS_BY_LEVEL[registerLevel]?.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <Label>الشعبة</Label>
                      <Select value={registerSection} onValueChange={setRegisterSection}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الشعبة" />
                        </SelectTrigger>
                        <SelectContent>
                          {SECTIONS_BY_LEVEL[registerLevel].map((section) => (
                            <SelectItem key={section} value={section}>
                              {section}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </motion.div>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-lg"
                >
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري إنشاء الحساب...
                  </>
                ) : (
                  'إنشاء حساب'
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
