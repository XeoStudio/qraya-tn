import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hash } from 'bcryptjs'

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
      case 'advanced-stats':
        return await getAdvancedStats()
      case 'users':
        return await getUsers(searchParams)
      case 'user-details':
        return await getUserDetails(searchParams)
      case 'logs':
        return await getLogs(searchParams)
      case 'promocodes':
        return await getPromoCodes()
      case 'errors':
        return await getErrors()
      case 'subscriptions':
        return await getSubscriptions(searchParams)
      case 'recent-activity':
        return await getRecentActivity()
      case 'system-logs':
        return await getSystemLogs(searchParams)
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
        return await banUser(body, admin.id)
      case 'unban-user':
        return await unbanUser(body, admin.id)
      case 'promote-user':
        return await promoteUser(body, admin.id)
      case 'delete-promo':
        return await deletePromoCode(body, admin.id)
      case 'create-admin':
        return await createAdmin(body, admin.id)
      case 'upgrade-subscription':
        return await upgradeSubscription(body, admin.id)
      case 'downgrade-subscription':
        return await downgradeSubscription(body, admin.id)
      case 'set-plan-expiry':
        return await setPlanExpiry(body, admin.id)
      case 'extend-subscription':
        return await extendSubscription(body, admin.id)
      case 'cancel-subscription':
        return await cancelSubscription(body, admin.id)
      case 'add-user-notes':
        return await addUserNotes(body, admin.id)
      case 'resolve-error':
        return await resolveError(body, admin.id)
      case 'send-notification':
        return await sendNotification(body, admin.id)
      case 'batch-action':
        return await batchAction(body, admin.id)
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
    recentSignups,
    openTickets,
    humanInterventionTickets
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
    }),
    db.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_USER'] } } }),
    db.supportTicket.count({ where: { needsHumanIntervention: true, status: { not: 'CLOSED' } } })
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
      recentSignups,
      openTickets,
      humanInterventionTickets
    }
  })
}

async function getAdvancedStats() {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  
  // User growth by day (last 30 days)
  const usersByDay = await db.$queryRaw`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM "User"
    WHERE created_at >= ${thirtyDaysAgo}
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `
  
  // Chat activity by day
  const chatsByDay = await db.$queryRaw`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM "Chat"
    WHERE created_at >= ${thirtyDaysAgo}
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `
  
  // Plan distribution
  const planDistribution = await db.subscription.groupBy({
    by: ['plan'],
    _count: { id: true }
  })
  
  // Active users today
  const activeToday = await db.user.count({
    where: { lastActive: { gte: oneDayAgo } }
  })
  
  // Active users this week
  const activeThisWeek = await db.user.count({
    where: { lastActive: { gte: sevenDaysAgo } }
  })
  
  // New subscriptions this week
  const newSubscriptionsThisWeek = await db.subscription.count({
    where: {
      createdAt: { gte: sevenDaysAgo },
      plan: { not: 'FREE' }
    }
  })
  
  // Expiring subscriptions in next 7 days
  const expiringSubscriptions = await db.subscription.count({
    where: {
      status: 'ACTIVE',
      endDate: {
        gte: now,
        lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      }
    }
  })
  
  // Total points in system
  const totalPoints = await db.user.aggregate({
    _sum: { points: true }
  })
  
  // Average points per user
  const avgPoints = await db.user.aggregate({
    _avg: { points: true }
  })
  
  // Top users by points
  const topUsers = await db.user.findMany({
    select: { id: true, name: true, email: true, points: true, streak: true },
    orderBy: { points: 'desc' },
    take: 10
  })
  
  // Users by level
  const usersByLevel = await db.user.groupBy({
    by: ['level'],
    _count: { id: true },
    where: { level: { not: null } }
  })
  
  // Users by governorate
  const usersByGovernorate = await db.user.groupBy({
    by: ['governorate'],
    _count: { id: true },
    where: { governorate: { not: null } }
  })
  
  return NextResponse.json({
    success: true,
    advancedStats: {
      usersByDay,
      chatsByDay,
      planDistribution,
      activeToday,
      activeThisWeek,
      newSubscriptionsThisWeek,
      expiringSubscriptions,
      totalPoints: totalPoints._sum.points || 0,
      avgPoints: Math.round(avgPoints._avg.points || 0),
      topUsers,
      usersByLevel,
      usersByGovernorate
    }
  })
}

async function getUsers(searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''
  const role = searchParams.get('role') || ''
  const status = searchParams.get('status') || ''
  const plan = searchParams.get('plan') || ''
  
  const where: Record<string, unknown> = {}
  
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } }
    ]
  }
  
  if (role) where.role = role
  if (status) where.status = status
  if (plan) {
    where.subscription = { plan }
  }
  
  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      include: {
        subscription: true,
        _count: { select: { chats: true, sessions: true, tickets: true } }
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
      year: u.year,
      section: u.section,
      governorate: u.governorate,
      points: u.points,
      streak: u.streak,
      plan: u.subscription?.plan || 'FREE',
      planStatus: u.subscription?.status,
      planEndDate: u.subscription?.endDate,
      chatsCount: u._count.chats,
      ticketsCount: u._count.tickets,
      createdAt: u.createdAt,
      lastActive: u.lastActive,
      bannedAt: u.bannedAt,
      bannedReason: u.bannedReason,
      notes: u.notes
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  })
}

async function getUserDetails(searchParams: URLSearchParams) {
  const userId = searchParams.get('userId')
  if (!userId) {
    return NextResponse.json({ success: false, error: 'معرف المستخدم مطلوب' }, { status: 400 })
  }
  
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      subscription: true,
      achievements: { take: 10, orderBy: { earnedAt: 'desc' } },
      studyStats: { take: 30, orderBy: { date: 'desc' } },
      _count: {
        select: {
          chats: true,
          sessions: true,
          tickets: true,
          flashcardDecks: true,
          studyPlans: true,
          activities: true
        }
      }
    }
  })
  
  if (!user) {
    return NextResponse.json({ success: false, error: 'المستخدم غير موجود' }, { status: 404 })
  }
  
  // Get recent activity
  const recentActivity = await db.activityLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20
  })
  
  return NextResponse.json({
    success: true,
    user: {
      ...user,
      recentActivity,
      counts: user._count
    }
  })
}

async function getLogs(searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const action = searchParams.get('action') || ''
  
  const where: Record<string, unknown> = {}
  if (action) where.action = { contains: action }
  
  const [logs, total] = await Promise.all([
    db.activityLog.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    db.activityLog.count({ where })
  ])
  
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
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { usages: true } }
    }
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
      totalUsages: p._count.usages,
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

async function getSubscriptions(searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const status = searchParams.get('status') || ''
  const plan = searchParams.get('plan') || ''
  
  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (plan) where.plan = plan
  
  const [subscriptions, total] = await Promise.all([
    db.subscription.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, level: true, levelName: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    db.subscription.count({ where })
  ])
  
  return NextResponse.json({
    success: true,
    subscriptions: subscriptions.map(s => ({
      id: s.id,
      userId: s.userId,
      user: s.user,
      plan: s.plan,
      status: s.status,
      startDate: s.startDate,
      endDate: s.endDate,
      features: {
        agentMode: s.agentMode,
        advancedAI: s.advancedAI,
        unlimitedChat: s.unlimitedChat,
        priority: s.priority,
        exportPDF: s.exportPDF,
        ocrUnlimited: s.ocrUnlimited,
        customPlans: s.customPlans
      },
      chatsUsed: s.chatsUsed,
      ocrUsed: s.ocrUsed,
      quotaLimit: s.quotaLimit,
      createdAt: s.createdAt
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  })
}

async function getRecentActivity() {
  const activities = await db.activityLog.findMany({
    include: {
      user: { select: { name: true, email: true, role: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  })
  
  return NextResponse.json({
    success: true,
    activities: activities.map(a => ({
      id: a.id,
      userId: a.userId,
      userName: a.user?.name,
      userEmail: a.user?.email,
      userRole: a.user?.role,
      action: a.action,
      details: a.details,
      createdAt: a.createdAt
    }))
  })
}

async function getSystemLogs(searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const level = searchParams.get('level') || ''
  const category = searchParams.get('category') || ''
  
  const where: Record<string, unknown> = {}
  if (level) where.level = level
  if (category) where.category = category
  
  const [logs, total] = await Promise.all([
    db.systemLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    db.systemLog.count({ where })
  ])
  
  return NextResponse.json({
    success: true,
    logs,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  })
}

// ============ POST Actions ============

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

async function banUser(body: { userId: string; reason: string }, adminId: string) {
  const { userId, reason } = body
  
  if (!userId || !reason) {
    return NextResponse.json({ success: false, error: 'معرف المستخدم والسبب مطلوبان' }, { status: 400 })
  }
  
  const targetUser = await db.user.findUnique({ where: { id: userId } })
  if (!targetUser) {
    return NextResponse.json({ success: false, error: 'المستخدم غير موجود' }, { status: 404 })
  }
  
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
  
  await db.session.deleteMany({ where: { userId } })
  
  await db.activityLog.create({
    data: {
      userId: adminId,
      action: 'ban-user',
      details: `حظر المستخدم ${targetUser.email} - السبب: ${reason}`
    }
  })
  
  return NextResponse.json({ success: true, user: { id: user.id, status: user.status } })
}

async function unbanUser(body: { userId: string }, adminId: string) {
  const { userId } = body
  
  const user = await db.user.update({
    where: { id: userId },
    data: {
      status: 'ACTIVE',
      bannedAt: null,
      bannedReason: null
    }
  })
  
  await db.activityLog.create({
    data: {
      userId: adminId,
      action: 'unban-user',
      details: `إلغاء حظر المستخدم ${user.email}`
    }
  })
  
  return NextResponse.json({ success: true, user: { id: user.id, status: user.status } })
}

async function promoteUser(body: { userId: string; role: string }, adminId: string) {
  const { userId, role } = body
  
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
  
  await db.activityLog.create({
    data: {
      userId: adminId,
      action: 'promote-user',
      details: `تغيير رتبة ${user.email} إلى ${role}`
    }
  })
  
  return NextResponse.json({ success: true, user: { id: user.id, role: user.role } })
}

async function deletePromoCode(body: { promoId: string }, adminId: string) {
  const { promoId } = body
  
  const promo = await db.promoCode.findUnique({ where: { id: promoId } })
  if (!promo) {
    return NextResponse.json({ success: false, error: 'الكود غير موجود' }, { status: 404 })
  }
  
  await db.promoCode.delete({ where: { id: promoId } })
  
  await db.activityLog.create({
    data: {
      userId: adminId,
      action: 'delete-promo',
      details: `حذف كود ${promo.code}`
    }
  })
  
  return NextResponse.json({ success: true })
}

async function createAdmin(body: { email: string; password: string; name: string }, adminId: string) {
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
  
  await db.activityLog.create({
    data: {
      userId: adminId,
      action: 'create-admin',
      details: `إنشاء مدير جديد: ${email}`
    }
  })
  
  return NextResponse.json({ success: true, admin: { id: admin.id, email: admin.email, name: admin.name } })
}

async function upgradeSubscription(body: {
  userId: string
  plan: string
  duration: number
  features?: Record<string, boolean>
}, adminId: string) {
  const { userId, plan, duration, features } = body
  
  if (!userId || !plan) {
    return NextResponse.json({ success: false, error: 'معرف المستخدم والخطة مطلوبان' }, { status: 400 })
  }
  
  const endDate = duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null
  
  const subscription = await db.subscription.upsert({
    where: { userId },
    create: {
      userId,
      plan: plan as 'BASIC' | 'PREMIUM' | 'BAC_PRO',
      status: 'ACTIVE',
      endDate,
      agentMode: features?.agentMode ?? (plan === 'PREMIUM' || plan === 'BAC_PRO'),
      advancedAI: features?.advancedAI ?? (plan === 'PREMIUM' || plan === 'BAC_PRO'),
      unlimitedChat: features?.unlimitedChat ?? (plan === 'PREMIUM' || plan === 'BAC_PRO'),
      priority: features?.priority ?? (plan === 'PREMIUM' || plan === 'BAC_PRO'),
      exportPDF: features?.exportPDF ?? (plan === 'PREMIUM' || plan === 'BAC_PRO'),
      ocrUnlimited: features?.ocrUnlimited ?? (plan === 'BAC_PRO'),
      customPlans: features?.customPlans ?? (plan === 'BAC_PRO'),
      quotaLimit: plan === 'PREMIUM' ? 999999 : plan === 'BAC_PRO' ? 999999 : 50
    },
    update: {
      plan: plan as 'BASIC' | 'PREMIUM' | 'BAC_PRO',
      status: 'ACTIVE',
      endDate,
      agentMode: features?.agentMode ?? (plan === 'PREMIUM' || plan === 'BAC_PRO'),
      advancedAI: features?.advancedAI ?? (plan === 'PREMIUM' || plan === 'BAC_PRO'),
      unlimitedChat: features?.unlimitedChat ?? (plan === 'PREMIUM' || plan === 'BAC_PRO'),
      priority: features?.priority ?? (plan === 'PREMIUM' || plan === 'BAC_PRO'),
      exportPDF: features?.exportPDF ?? (plan === 'PREMIUM' || plan === 'BAC_PRO'),
      ocrUnlimited: features?.ocrUnlimited ?? (plan === 'BAC_PRO'),
      customPlans: features?.customPlans ?? (plan === 'BAC_PRO'),
      quotaLimit: plan === 'PREMIUM' ? 999999 : plan === 'BAC_PRO' ? 999999 : 50
    }
  })
  
  // Also update user role if needed
  if (plan !== 'FREE') {
    await db.user.update({
      where: { id: userId },
      data: { role: 'PREMIUM' }
    })
  }
  
  await db.activityLog.create({
    data: {
      userId: adminId,
      action: 'upgrade-subscription',
      details: `ترقية اشتراك ${userId} إلى ${plan} لمدة ${duration} يوم`
    }
  })
  
  return NextResponse.json({ success: true, subscription })
}

async function downgradeSubscription(body: { userId: string }, adminId: string) {
  const { userId } = body
  
  const subscription = await db.subscription.update({
    where: { userId },
    data: {
      plan: 'FREE',
      status: 'ACTIVE',
      endDate: null,
      agentMode: false,
      advancedAI: false,
      unlimitedChat: false,
      priority: false,
      exportPDF: false,
      ocrUnlimited: false,
      customPlans: false,
      quotaLimit: 50
    }
  })
  
  await db.user.update({
    where: { id: userId },
    data: { role: 'USER' }
  })
  
  await db.activityLog.create({
    data: {
      userId: adminId,
      action: 'downgrade-subscription',
      details: `تخفيض اشتراك ${userId} إلى مجاني`
    }
  })
  
  return NextResponse.json({ success: true, subscription })
}

async function setPlanExpiry(body: { userId: string; endDate: string }, adminId: string) {
  const { userId, endDate } = body
  
  const subscription = await db.subscription.update({
    where: { userId },
    data: { endDate: new Date(endDate) }
  })
  
  await db.activityLog.create({
    data: {
      userId: adminId,
      action: 'set-plan-expiry',
      details: `تحديد تاريخ انتهاء اشتراك ${userId}: ${endDate}`
    }
  })
  
  return NextResponse.json({ success: true, subscription })
}

async function extendSubscription(body: { userId: string; days: number }, adminId: string) {
  const { userId, days } = body
  
  const current = await db.subscription.findUnique({ where: { userId } })
  if (!current) {
    return NextResponse.json({ success: false, error: 'الاشتراك غير موجود' }, { status: 404 })
  }
  
  const currentEnd = current.endDate || new Date()
  const newEnd = new Date(currentEnd.getTime() + days * 24 * 60 * 60 * 1000)
  
  const subscription = await db.subscription.update({
    where: { userId },
    data: { endDate: newEnd, status: 'ACTIVE' }
  })
  
  await db.activityLog.create({
    data: {
      userId: adminId,
      action: 'extend-subscription',
      details: `تمديد اشتراك ${userId} بـ ${days} يوم`
    }
  })
  
  return NextResponse.json({ success: true, subscription })
}

async function cancelSubscription(body: { userId: string; reason: string }, adminId: string) {
  const { userId, reason } = body
  
  const subscription = await db.subscription.update({
    where: { userId },
    data: {
      status: 'CANCELLED',
      plan: 'FREE',
      agentMode: false,
      advancedAI: false,
      unlimitedChat: false,
      priority: false,
      exportPDF: false,
      ocrUnlimited: false,
      customPlans: false
    }
  })
  
  await db.user.update({
    where: { id: userId },
    data: { role: 'USER' }
  })
  
  await db.activityLog.create({
    data: {
      userId: adminId,
      action: 'cancel-subscription',
      details: `إلغاء اشتراك ${userId} - السبب: ${reason}`
    }
  })
  
  return NextResponse.json({ success: true, subscription })
}

async function addUserNotes(body: { userId: string; notes: string }, adminId: string) {
  const { userId, notes } = body
  
  const user = await db.user.update({
    where: { id: userId },
    data: { notes }
  })
  
  await db.activityLog.create({
    data: {
      userId: adminId,
      action: 'add-user-notes',
      details: `إضافة ملاحظات للمستخدم ${userId}`
    }
  })
  
  return NextResponse.json({ success: true, user: { id: user.id, notes: user.notes } })
}

async function resolveError(body: { errorId: string }, adminId: string) {
  const { errorId } = body
  
  const error = await db.errorReport.update({
    where: { id: errorId },
    data: { status: 'resolved', resolvedAt: new Date() }
  })
  
  await db.activityLog.create({
    data: {
      userId: adminId,
      action: 'resolve-error',
      details: `حل خطأ ${errorId}`
    }
  })
  
  return NextResponse.json({ success: true, error })
}

async function sendNotification(body: { userId: string; title: string; message: string }, adminId: string) {
  // Log the notification (you can implement actual notification system later)
  await db.activityLog.create({
    data: {
      userId: body.userId,
      action: 'notification',
      details: `${body.title}: ${body.message}`
    }
  })
  
  await db.activityLog.create({
    data: {
      userId: adminId,
      action: 'send-notification',
      details: `إرسال إشعار إلى ${body.userId}: ${body.title}`
    }
  })
  
  return NextResponse.json({ success: true, message: 'تم إرسال الإشعار' })
}

async function batchAction(body: { action: string; userIds: string[]; data?: Record<string, unknown> }, adminId: string) {
  const { action, userIds, data } = body
  
  if (!userIds || userIds.length === 0) {
    return NextResponse.json({ success: false, error: 'لا يوجد مستخدمين محددين' }, { status: 400 })
  }
  
  let result = { count: 0 }
  
  switch (action) {
    case 'ban':
      result = await db.user.updateMany({
        where: { id: { in: userIds }, email: { not: SUPER_ADMIN_EMAIL } },
        data: { status: 'BANNED', bannedAt: new Date(), bannedReason: data?.reason as string }
      })
      break
      
    case 'unban':
      result = await db.user.updateMany({
        where: { id: { in: userIds } },
        data: { status: 'ACTIVE', bannedAt: null, bannedReason: null }
      })
      break
      
    case 'delete-sessions':
      result = await db.session.deleteMany({
        where: { userId: { in: userIds } }
      })
      break
      
    case 'reset-quota':
      result = await db.subscription.updateMany({
        where: { userId: { in: userIds } },
        data: { chatsUsed: 0, ocrUsed: 0 }
      })
      break
  }
  
  await db.activityLog.create({
    data: {
      userId: adminId,
      action: 'batch-action',
      details: `${action} لـ ${userIds.length} مستخدم`
    }
  })
  
  return NextResponse.json({ success: true, affected: result.count })
}
