import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hash } from 'bcryptjs'
import { randomBytes } from 'crypto'

// Super admin email - cannot be banned or demoted
const SUPER_ADMIN_EMAIL = 'wissemlahkiri2@gmail.com'

// Helper to check admin access
async function checkAdmin(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value
  
  if (!token) return null
  
  const session = await db.session.findUnique({
    where: { token },
    include: { user: true }
  })
  
  if (!session || session.expiresAt < new Date()) return null
  if (session.user.role !== 'ADMIN') return null
  
  return session.user
}

// GET - Get admin data
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdmin(request)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    switch (action) {
      case 'stats':
        return await getStats()
      case 'users':
        return await getUsers(searchParams)
      case 'logs':
        return await getLogs(searchParams)
      case 'promocodes':
        return await getPromoCodes()
      case 'errors':
        return await getErrors()
      default:
        return NextResponse.json({ success: false, error: 'إجراء غير معروف' }, { status: 400 })
    }
  } catch (error) {
    console.error('Admin GET error:', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ' }, { status: 500 })
  }
}

// POST - Admin actions
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdmin(request)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 })
    }
    
    const body = await request.json()
    const { action } = body
    
    switch (action) {
      case 'create-promo':
        return await createPromoCode(body, admin.id)
      case 'ban-user':
        return await banUser(body)
      case 'unban-user':
        return await unbanUser(body)
      case 'promote-user':
        return await promoteUser(body)
      case 'delete-promo':
        return await deletePromoCode(body)
      case 'create-admin':
        return await createAdmin(body)
      default:
        return NextResponse.json({ success: false, error: 'إجراء غير معروف' }, { status: 400 })
    }
  } catch (error) {
    console.error('Admin POST error:', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ' }, { status: 500 })
  }
}

async function getStats() {
  const [
    totalUsers,
    activeUsers,
    premiumUsers,
    bannedUsers,
    totalChats,
    totalPromoCodes,
    activeSubscriptions,
    recentSignups
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { status: 'ACTIVE' } }),
    db.user.count({ where: { role: { in: ['PREMIUM', 'ADMIN'] } } }),
    db.user.count({ where: { status: 'BANNED' } }),
    db.chat.count(),
    db.promoCode.count(),
    db.subscription.count({ where: { status: 'ACTIVE', plan: { not: 'FREE' } } }),
    db.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    })
  ])
  
  return NextResponse.json({
    success: true,
    stats: {
      totalUsers,
      activeUsers,
      premiumUsers,
      bannedUsers,
      totalChats,
      totalPromoCodes,
      activeSubscriptions,
      recentSignups
    }
  })
}

async function getUsers(searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''
  const role = searchParams.get('role') || ''
  
  const where = {
    OR: search ? [
      { email: { contains: search } },
      { name: { contains: search } }
    ] : undefined,
    role: role ? role as 'USER' | 'PREMIUM' | 'ADMIN' : undefined
  }
  
  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      include: {
        subscription: true,
        _count: { select: { chats: true, sessions: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    db.user.count({ where })
  ])
  
  return NextResponse.json({
    success: true,
    users: users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      status: u.status,
      level: u.level,
      levelName: u.levelName,
      points: u.points,
      streak: u.streak,
      plan: u.subscription?.plan || 'FREE',
      chatsCount: u._count.chats,
      createdAt: u.createdAt,
      lastActive: u.lastActive,
      bannedAt: u.bannedAt,
      bannedReason: u.bannedReason
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  })
}

async function getLogs(searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  
  const logs = await db.activityLog.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit
  })
  
  const total = await db.activityLog.count()
  
  return NextResponse.json({
    success: true,
    logs: logs.map(l => ({
      id: l.id,
      userId: l.userId,
      userName: l.user?.name,
      userEmail: l.user?.email,
      action: l.action,
      details: l.details,
      createdAt: l.createdAt
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  })
}

async function getPromoCodes() {
  const promoCodes = await db.promoCode.findMany({
    orderBy: { createdAt: 'desc' }
  })
  
  return NextResponse.json({
    success: true,
    promoCodes: promoCodes.map(p => ({
      id: p.id,
      code: p.code,
      planType: p.planType,
      duration: p.duration,
      maxUses: p.maxUses,
      usedCount: p.usedCount,
      isActive: p.isActive,
      features: {
        agentMode: p.agentMode,
        advancedAI: p.advancedAI,
        unlimitedChat: p.unlimitedChat,
        priority: p.priority,
        exportPDF: p.exportPDF,
        ocrUnlimited: p.ocrUnlimited,
        customPlans: p.customPlans
      },
      expiresAt: p.expiresAt,
      createdAt: p.createdAt
    }))
  })
}

async function getErrors() {
  const errors = await db.errorReport.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50
  })
  
  return NextResponse.json({
    success: true,
    errors: errors.map(e => ({
      id: e.id,
      type: e.type,
      message: e.message,
      details: e.details,
      status: e.status,
      userName: e.user?.name,
      userEmail: e.user?.email,
      createdAt: e.createdAt,
      resolvedAt: e.resolvedAt
    }))
  })
}

async function createPromoCode(body: {
  code: string
  planType: string
  duration?: number
  maxUses?: number
  agentMode?: boolean
  advancedAI?: boolean
  unlimitedChat?: boolean
  priority?: boolean
  exportPDF?: boolean
  ocrUnlimited?: boolean
  customPlans?: boolean
}, createdBy: string) {
  const { code, planType, duration, maxUses, ...features } = body
  
  if (!code || !planType) {
    return NextResponse.json({ success: false, error: 'الكود ونوع الخطة مطلوبان' }, { status: 400 })
  }
  
  const existing = await db.promoCode.findUnique({ where: { code: code.toUpperCase() } })
  if (existing) {
    return NextResponse.json({ success: false, error: 'الكود موجود مسبقاً' }, { status: 400 })
  }
  
  const promoCode = await db.promoCode.create({
    data: {
      code: code.toUpperCase(),
      planType: planType as 'BASIC' | 'PREMIUM' | 'BAC_PRO',
      duration: duration || null,
      maxUses: maxUses || null,
      ...features,
      createdBy
    }
  })
  
  // Log activity
  await db.activityLog.create({
    data: {
      userId: createdBy,
      action: 'create-promo',
      details: `تم إنشاء كود ${code} - ${planType}`
    }
  })
  
  return NextResponse.json({ success: true, promoCode })
}

async function banUser(body: { userId: string; reason: string }) {
  const { userId, reason } = body
  
  if (!userId || !reason) {
    return NextResponse.json({ success: false, error: 'معرف المستخدم والسبب مطلوبان' }, { status: 400 })
  }
  
  // Check if this is the super admin
  const targetUser = await db.user.findUnique({ where: { id: userId } })
  if (!targetUser) {
    return NextResponse.json({ success: false, error: 'المستخدم غير موجود' }, { status: 404 })
  }
  
  // Cannot ban super admin
  if (targetUser.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
    return NextResponse.json({ 
      success: false, 
      error: 'لا يمكن حظر المدير الرئيسي للنظام' 
    }, { status: 403 })
  }
  
  const user = await db.user.update({
    where: { id: userId },
    data: {
      status: 'BANNED',
      bannedAt: new Date(),
      bannedReason: reason
    }
  })
  
  // Delete all sessions
  await db.session.deleteMany({ where: { userId } })
  
  return NextResponse.json({ success: true, user: { id: user.id, status: user.status } })
}

async function unbanUser(body: { userId: string }) {
  const { userId } = body
  
  const user = await db.user.update({
    where: { id: userId },
    data: {
      status: 'ACTIVE',
      bannedAt: null,
      bannedReason: null
    }
  })
  
  return NextResponse.json({ success: true, user: { id: user.id, status: user.status } })
}

async function promoteUser(body: { userId: string; role: string }) {
  const { userId, role } = body
  
  // Check if this is the super admin being demoted
  const targetUser = await db.user.findUnique({ where: { id: userId } })
  if (targetUser && targetUser.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() && role !== 'ADMIN') {
    return NextResponse.json({ 
      success: false, 
      error: 'لا يمكن تخفيض رتبة المدير الرئيسي للنظام' 
    }, { status: 403 })
  }
  
  const user = await db.user.update({
    where: { id: userId },
    data: { role: role as 'USER' | 'PREMIUM' | 'ADMIN' }
  })
  
  return NextResponse.json({ success: true, user: { id: user.id, role: user.role } })
}

async function deletePromoCode(body: { promoId: string }) {
  const { promoId } = body
  
  await db.promoCode.delete({ where: { id: promoId } })
  
  return NextResponse.json({ success: true })
}

async function createAdmin(body: { email: string; password: string; name: string }) {
  const { email, password, name } = body
  
  if (!email || !password || !name) {
    return NextResponse.json({ success: false, error: 'جميع الحقول مطلوبة' }, { status: 400 })
  }
  
  const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } })
  if (existing) {
    return NextResponse.json({ success: false, error: 'البريد مستخدم مسبقاً' }, { status: 400 })
  }
  
  const hashedPassword = await hash(password, 12)
  
  const admin = await db.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role: 'ADMIN',
      status: 'ACTIVE',
      isVerified: true,
      subscription: {
        create: {
          plan: 'PREMIUM',
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
      }
    }
  })
  
  return NextResponse.json({ success: true, admin: { id: admin.id, email: admin.email, name: admin.name } })
}
