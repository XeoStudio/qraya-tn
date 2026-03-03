'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

export interface User {
  id: string
  email: string
  name: string | null
  avatar: string | null
  level: string | null
  levelName: string | null
  year: string | null
  section: string | null
  governorate: string | null
  role: 'USER' | 'PREMIUM' | 'ADMIN'
  status: 'ACTIVE' | 'BANNED' | 'INACTIVE'
  points: number
  streak: number
  isVerified: boolean
  createdAt: string
}

export interface Subscription {
  id: string
  plan: 'FREE' | 'BASIC' | 'PREMIUM' | 'BAC_PRO'
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
  agentMode: boolean
  advancedAI: boolean
  unlimitedChat: boolean
  priority: boolean
  exportPDF: boolean
  ocrUnlimited: boolean
  customPlans: boolean
  chatsUsed: number
  quotaLimit: number
  endDate: string | null
}

interface AuthContextType {
  user: User | null
  subscription: Subscription | null
  loading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  isPremium: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>
  refreshUser: () => Promise<void>
}

export interface RegisterData {
  email: string
  password: string
  name: string
  level?: string
  year?: string
  section?: string
  governorate?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  const isAuthenticated = !!user
  const isAdmin = user?.role === 'ADMIN'
  const isPremium = user?.role === 'PREMIUM' || user?.role === 'ADMIN' || subscription?.plan === 'PREMIUM' || subscription?.plan === 'BAC_PRO'

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth', {
        method: 'GET',
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        setSubscription(data.subscription)
      } else {
        setUser(null)
        setSubscription(null)
      }
    } catch {
      setUser(null)
      setSubscription(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
        credentials: 'include'
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setUser(data.user)
        setSubscription(data.subscription)
        return { success: true }
      }
      return { success: false, error: data.error || 'فشل تسجيل الدخول' }
    } catch {
      return { success: false, error: 'حدث خطأ في الاتصال' }
    }
  }

  const register = async (registerData: RegisterData) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', ...registerData }),
        credentials: 'include'
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setUser(data.user)
        setSubscription(data.subscription)
        return { success: true }
      }
      return { success: false, error: data.error || 'فشل إنشاء الحساب' }
    } catch {
      return { success: false, error: 'حدث خطأ في الاتصال' }
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
        credentials: 'include'
      })
    } finally {
      setUser(null)
      setSubscription(null)
    }
  }

  const updateProfile = async (profileData: Partial<User>) => {
    try {
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-profile', ...profileData }),
        credentials: 'include'
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setUser(data.user)
        return { success: true }
      }
      return { success: false, error: data.error || 'فشل تحديث الملف' }
    } catch {
      return { success: false, error: 'حدث خطأ في الاتصال' }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        subscription,
        loading,
        isAuthenticated,
        isAdmin,
        isPremium,
        login,
        register,
        logout,
        updateProfile,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
