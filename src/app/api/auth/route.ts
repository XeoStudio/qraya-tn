import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hash, compare } from 'bcryptjs'
import { randomBytes } from 'crypto'

// Super admin email - automatically gets full admin access
const SUPER_ADMIN_EMAIL = 'wissemlahkiri2@gmail.com'

// Helper to generate JWT-like token (simplified)
function generateToken(): string {
  return randomBytes(32).toString('hex')
}

// Rate limiting (in-memory for simplicity)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes
const MAX_ATTEMPTS = 5

function checkRateLimit(email: string): boolean {
  const now = Date.now()
  const attempts = loginAttempts.get(email)
  
  if (!attempts) {
    loginAttempts.set(email, { count: 1, lastAttempt: now })
    return true
  }
  
  if (now - attempts.lastAttempt > RATE_LIMIT_WINDOW) {
    loginAttempts.set(email, { count: 1, lastAttempt: now })
    return true
  }
  
  if (attempts.count >= MAX_ATTEMPTS) {
    return false
  }
  
  attempts.count++
  attempts.lastAttempt = now
  return true
}

// Check if email is super admin
function isSuperAdmin(email: string): boolean {
  return email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
}

// Ensure super admin has full privileges
async function ensureSuperAdminPrivileges(userId: string) {
  // Update user role to ADMIN
  await db.user.update({
    where: { id: userId },
    data: { 
      role: 'ADMIN',
      status: 'ACTIVE',
      isVerified: true
    }
  })

  // Check if subscription exists
  const existingSub = await db.subscription.findUnique({
    where: { userId }
  })

  if (existingSub) {
    // Update existing subscription to full privileges
    await db.subscription.update({
      where: { userId },
      data: {
        plan: 'LIFETIME',
        status: 'ACTIVE',
        agentMode: true,
        advancedAI: true,
        unlimitedChat: true,
        priority: true,
        exportPDF: true,
        ocrUnlimited: true,
        customPlans: true,
        quotaLimit: 999999
      }
    })
  } else {
    // Create new subscription with full privileges
    await db.subscription.create({
      data: {
        userId,
        plan: 'LIFETIME',
        status: 'ACTIVE',
        agentMode: true,
        advancedAI: true,
        unlimitedChat: true,
        priority: true,
        exportPDF: true,
        ocrUnlimited: true,
        customPlans: true,
        quotaLimit: 999999
      }
    })
  }
}

// GET - Get current user
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value
    
    if (!token) {
      return NextResponse.json({ success: false, error: 'غير مصادق' }, { status: 401 })
    }
    
    const session = await db.session.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            subscription: true
          }
        }
      }
    })
    
    if (!session || session.expiresAt < new Date()) {
      await db.session.delete({ where: { token } }).catch(() => {})
      return NextResponse.json({ success: false, error: 'الجلسة منتهية' }, { status: 401 })
    }

    // Ensure super admin privileges on every request
    if (isSuperAdmin(session.user.email)) {
      await ensureSuperAdminPrivileges(session.user.id)
      // Refetch user with updated data
      const updatedUser = await db.user.findUnique({
        where: { id: session.user.id },
        include: { subscription: true }
      })
      if (updatedUser) {
        session.user = updatedUser
      }
    }
    
    return NextResponse.json({
      success: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        avatar: session.user.avatar,
        level: session.user.level,
        levelName: session.user.levelName,
        year: session.user.year,
        section: session.user.section,
        role: session.user.role,
        status: session.user.status,
        points: session.user.points,
        streak: session.user.streak,
        isVerified: session.user.isVerified,
        createdAt: session.user.createdAt
      },
      subscription: session.user.subscription ? {
        id: session.user.subscription.id,
        plan: session.user.subscription.plan,
        status: session.user.subscription.status,
        agentMode: session.user.subscription.agentMode,
        advancedAI: session.user.subscription.advancedAI,
        unlimitedChat: session.user.subscription.unlimitedChat,
        priority: session.user.subscription.priority,
        exportPDF: session.user.subscription.exportPDF,
        ocrUnlimited: session.user.subscription.ocrUnlimited,
        customPlans: session.user.subscription.customPlans,
        chatsUsed: session.user.subscription.chatsUsed,
        quotaLimit: session.user.subscription.quotaLimit,
        endDate: session.user.subscription.endDate
      } : null
    })
  } catch (error) {
    console.error('Auth GET error:', error)
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    return NextResponse.json({ 
      success: false, 
      error: 'حدث خطأ',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 })
  }
}

// POST - Login, Register, Logout
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body
    
    switch (action) {
      case 'login':
        return await handleLogin(body, request)
      case 'register':
        return await handleRegister(body)
      case 'logout':
        return await handleLogout(request)
      default:
        return NextResponse.json({ success: false, error: 'إجراء غير معروف' }, { status: 400 })
    }
  } catch (error) {
    console.error('Auth POST error:', error)
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'
    return NextResponse.json({ 
      success: false, 
      error: 'حدث خطأ',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 })
  }
}

async function handleLogin(body: { email: string; password: string }, request: NextRequest) {
  const { email, password } = body
  
  if (!email || !password) {
    return NextResponse.json({ success: false, error: 'البريد وكلمة المرور مطلوبان' }, { status: 400 })
  }
  
  // Check rate limit (skip for super admin)
  if (!isSuperAdmin(email) && !checkRateLimit(email)) {
    return NextResponse.json({ 
      success: false, 
      error: 'تم حظر الحساب مؤقتاً بسبب محاولات كثيرة. حاول بعد 15 دقيقة' 
    }, { status: 429 })
  }
  
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { subscription: true }
  })
  
  if (!user) {
    return NextResponse.json({ success: false, error: 'البريد أو كلمة المرور غير صحيحة' }, { status: 401 })
  }
  
  const isValidPassword = await compare(password, user.password)
  if (!isValidPassword) {
    return NextResponse.json({ success: false, error: 'البريد أو كلمة المرور غير صحيحة' }, { status: 401 })
  }
  
  if (user.status === 'BANNED' && !isSuperAdmin(email)) {
    return NextResponse.json({ 
      success: false, 
      error: `تم حظر حسابك. السبب: ${user.bannedReason || 'غير محدد'}` 
    }, { status: 403 })
  }

  // Ensure super admin privileges
  if (isSuperAdmin(email)) {
    await ensureSuperAdminPrivileges(user.id)
    // Refetch user with updated subscription
    const updatedUser = await db.user.findUnique({
      where: { id: user.id },
      include: { subscription: true }
    })
    if (updatedUser) {
      Object.assign(user, updatedUser)
    }
  }
  
  // Create session
  const token = generateToken()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  
  await db.session.create({
    data: {
      userId: user.id,
      token,
      expiresAt
    }
  })
  
  // Update last active
  await db.user.update({
    where: { id: user.id },
    data: { lastActive: new Date() }
  })
  
  // Log activity
  await db.activityLog.create({
    data: {
      userId: user.id,
      action: 'login',
      details: 'تسجيل دخول ناجح'
    }
  })
  
  const response = NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      level: user.level,
      levelName: user.levelName,
      year: user.year,
      section: user.section,
      role: user.role,
      status: user.status,
      points: user.points,
      streak: user.streak,
      isVerified: user.isVerified,
      createdAt: user.createdAt
    },
    subscription: user.subscription ? {
      id: user.subscription.id,
      plan: user.subscription.plan,
      status: user.subscription.status,
      agentMode: user.subscription.agentMode,
      advancedAI: user.subscription.advancedAI,
      unlimitedChat: user.subscription.unlimitedChat,
      priority: user.subscription.priority,
      exportPDF: user.subscription.exportPDF,
      ocrUnlimited: user.subscription.ocrUnlimited,
      customPlans: user.subscription.customPlans,
      chatsUsed: user.subscription.chatsUsed,
      quotaLimit: user.subscription.quotaLimit,
      endDate: user.subscription.endDate
    } : null
  })
  
  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/'
  })
  
  return response
}

async function handleRegister(body: {
  email: string
  password: string
  name: string
  level?: string
  year?: string
  section?: string
}) {
  const { email, password, name, level, year, section } = body
  
  if (!email || !password || !name) {
    return NextResponse.json({ 
      success: false, 
      error: 'البريد وكلمة المرور والاسم مطلوبة' 
    }, { status: 400 })
  }
  
  if (password.length < 6) {
    return NextResponse.json({ 
      success: false, 
      error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' 
    }, { status: 400 })
  }
  
  // Check if user exists
  const existingUser = await db.user.findUnique({
    where: { email: email.toLowerCase() }
  })
  
  if (existingUser) {
    return NextResponse.json({ 
      success: false, 
      error: 'البريد الإلكتروني مستخدم بالفعل' 
    }, { status: 400 })
  }
  
  // Hash password
  const hashedPassword = await hash(password, 12)
  
  // Level names
  const levelNames: Record<string, string> = {
    'primary': 'الابتدائي',
    'preparatory': 'الإعدادي',
    'secondary': 'الثانوي',
    'bac': 'الباكالوريا'
  }

  // Check if this is the super admin
  const isSuper = isSuperAdmin(email)
  
  // Create user with subscription
  const user = await db.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      level: level || null,
      levelName: level ? levelNames[level] : null,
      year: year || null,
      section: section || null,
      role: isSuper ? 'ADMIN' : 'USER',
      status: 'ACTIVE',
      isVerified: isSuper,
      subscription: {
        create: {
          plan: isSuper ? 'LIFETIME' : 'FREE',
          status: 'ACTIVE',
          agentMode: isSuper,
          advancedAI: isSuper,
          unlimitedChat: isSuper,
          priority: isSuper,
          exportPDF: isSuper,
          ocrUnlimited: isSuper,
          customPlans: isSuper,
          quotaLimit: isSuper ? 999999 : 50
        }
      }
    },
    include: { subscription: true }
  })
  
  // Create session
  const token = generateToken()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  
  await db.session.create({
    data: {
      userId: user.id,
      token,
      expiresAt
    }
  })
  
  // Give welcome points
  await db.user.update({
    where: { id: user.id },
    data: { points: isSuper ? 1000 : 10 }
  })
  
  // Create welcome achievement
  await db.achievement.create({
    data: {
      userId: user.id,
      type: isSuper ? 'admin' : 'welcome',
      title: isSuper ? 'مرحباً بك يا مدير! 👑' : 'مرحباً بك! 🎉',
      description: isSuper ? 'لديك صلاحيات المدير الكاملة' : 'أهلاً بك في مساعد دراسة تونسي'
    }
  })

  // Log activity
  await db.activityLog.create({
    data: {
      userId: user.id,
      action: isSuper ? 'admin-register' : 'register',
      details: isSuper ? 'تم إنشاء حساب المدير الرئيسي' : 'تسجيل حساب جديد'
    }
  })
  
  const response = NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      level: user.level,
      levelName: user.levelName,
      year: user.year,
      section: user.section,
      role: user.role,
      status: user.status,
      points: user.points,
      streak: user.streak,
      isVerified: user.isVerified,
      createdAt: user.createdAt
    },
    subscription: user.subscription ? {
      id: user.subscription.id,
      plan: user.subscription.plan,
      status: user.subscription.status,
      agentMode: user.subscription.agentMode,
      advancedAI: user.subscription.advancedAI,
      unlimitedChat: user.subscription.unlimitedChat,
      priority: user.subscription.priority,
      exportPDF: user.subscription.exportPDF,
      ocrUnlimited: user.subscription.ocrUnlimited,
      customPlans: user.subscription.customPlans,
      chatsUsed: user.subscription.chatsUsed,
      quotaLimit: user.subscription.quotaLimit,
      endDate: user.subscription.endDate
    } : null
  })
  
  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/'
  })
  
  return response
}

async function handleLogout(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value
  
  if (token) {
    await db.session.delete({ where: { token } }).catch(() => {})
  }
  
  const response = NextResponse.json({ success: true })
  response.cookies.delete('auth_token')
  
  return response
}
