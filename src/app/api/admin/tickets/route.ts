import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getZAI } from '@/lib/zai'

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

// AI function to summarize and classify ticket
async function analyzeTicket(title: string, messages: string[]): Promise<{
  summary: string
  classification: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  suggestedAction: string
}> {
  try {
    const zai = await getZAI()
    
    const messagesText = messages.join('\n')
    
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `أنت محلل تذاكر دعم فني. قم بتحليل التذكرة وتقديم:
1. ملخص مختصر (سطر واحد)
2. التصنيف المناسب
3. مستوى الأولوية
4. الإجراء المقترح

أعد الرد بتنسيق JSON فقط:
{
  "summary": "ملخص التذكرة",
  "classification": "التصنيف",
  "priority": "LOW|MEDIUM|HIGH|URGENT",
  "suggestedAction": "الإجراء المقترح"
}`
        },
        {
          role: 'user',
          content: `عنوان التذكرة: ${title}\n\nالرسائل:\n${messagesText}`
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    })
    
    const response = completion.choices[0]?.message?.content || '{}'
    return JSON.parse(response)
  } catch {
    return {
      summary: 'لم يتم تحليل التذكرة',
      classification: 'عام',
      priority: 'MEDIUM',
      suggestedAction: 'مراجعة التذكرة'
    }
  }
}

// GET - Fetch all tickets for admin
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdmin(request)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const needsHuman = searchParams.get('needsHuman')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    const where: Record<string, unknown> = {}
    
    if (status && status !== 'all') {
      where.status = status
    }
    
    if (needsHuman === 'true') {
      where.needsHumanIntervention = true
    }
    
    const [tickets, total] = await Promise.all([
      db.supportTicket.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              level: true,
              levelName: true
            }
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' }
          },
          _count: {
            select: { messages: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.supportTicket.count({ where })
    ])
    
    return NextResponse.json({
      success: true,
      tickets: tickets.map(t => ({
        id: t.id,
        title: t.title,
        category: t.category,
        status: t.status,
        priority: t.priority,
        needsHumanIntervention: t.needsHumanIntervention,
        rating: t.rating,
        feedback: t.feedback,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        closedAt: t.closedAt,
        user: t.user,
        lastMessage: t.messages[0]?.content || '',
        messagesCount: t._count.messages
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Admin tickets GET error:', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ' }, { status: 500 })
  }
}

// POST - Admin actions on tickets
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdmin(request)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 })
    }
    
    const body = await request.json()
    const { action, ticketId, message, priority, status } = body
    
    switch (action) {
      case 'get-details':
        return await getTicketDetails(ticketId)
      case 'analyze':
        return await analyzeTicketAction(ticketId)
      case 'reply':
        return await replyToTicket(ticketId, message, admin.id)
      case 'update-status':
        return await updateTicketStatus(ticketId, status, priority)
      case 'close':
        return await closeTicket(ticketId, admin.id)
      case 'reopen':
        return await reopenTicket(ticketId)
      case 'accept-intervention':
        return await acceptIntervention(ticketId, admin.id)
      default:
        return NextResponse.json({ success: false, error: 'إجراء غير معروف' }, { status: 400 })
    }
  } catch (error) {
    console.error('Admin tickets POST error:', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ' }, { status: 500 })
  }
}

async function getTicketDetails(ticketId: string) {
  const ticket = await db.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          level: true,
          levelName: true,
          governorate: true,
          subscription: {
            select: { plan: true, status: true }
          }
        }
      },
      messages: {
        include: {
          user: {
            select: { name: true, role: true }
          }
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  })
  
  if (!ticket) {
    return NextResponse.json({ success: false, error: 'التذكرة غير موجودة' }, { status: 404 })
  }
  
  return NextResponse.json({ success: true, ticket })
}

async function analyzeTicketAction(ticketId: string) {
  const ticket = await db.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 10
      }
    }
  })
  
  if (!ticket) {
    return NextResponse.json({ success: false, error: 'التذكرة غير موجودة' }, { status: 404 })
  }
  
  const messages = ticket.messages.map(m => m.content)
  const analysis = await analyzeTicket(ticket.title, messages)
  
  // Update ticket with analysis
  await db.supportTicket.update({
    where: { id: ticketId },
    data: {
      priority: analysis.priority
    }
  })
  
  return NextResponse.json({ success: true, analysis })
}

async function replyToTicket(ticketId: string, message: string, adminId: string) {
  if (!message?.trim()) {
    return NextResponse.json({ success: false, error: 'الرسالة مطلوبة' }, { status: 400 })
  }
  
  const ticket = await db.supportTicket.findUnique({
    where: { id: ticketId }
  })
  
  if (!ticket) {
    return NextResponse.json({ success: false, error: 'التذكرة غير موجودة' }, { status: 404 })
  }
  
  if (ticket.status === 'CLOSED') {
    return NextResponse.json({ success: false, error: 'التذكرة مغلقة' }, { status: 400 })
  }
  
  // Add admin message
  await db.ticketMessage.create({
    data: {
      ticketId,
      userId: adminId,
      content: message.trim(),
      isFromAI: false,
      isFromAdmin: true
    }
  })
  
  // Update ticket status
  await db.supportTicket.update({
    where: { id: ticketId },
    data: {
      status: 'WAITING_USER',
      updatedAt: new Date()
    }
  })
  
  // Log activity
  await db.activityLog.create({
    data: {
      userId: adminId,
      action: 'admin-reply-ticket',
      details: `رد على التذكرة ${ticketId}`
    }
  })
  
  // Fetch updated ticket
  const updatedTicket = await db.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      user: { select: { name: true, email: true } },
      messages: {
        include: { user: { select: { name: true, role: true } } },
        orderBy: { createdAt: 'asc' }
      }
    }
  })
  
  return NextResponse.json({ success: true, ticket: updatedTicket })
}

async function updateTicketStatus(ticketId: string, status?: string, priority?: string) {
  const updateData: Record<string, unknown> = { updatedAt: new Date() }
  
  if (status) updateData.status = status
  if (priority) updateData.priority = priority
  
  const ticket = await db.supportTicket.update({
    where: { id: ticketId },
    data: updateData
  })
  
  return NextResponse.json({ success: true, ticket })
}

async function closeTicket(ticketId: string, adminId: string) {
  const ticket = await db.supportTicket.update({
    where: { id: ticketId },
    data: {
      status: 'CLOSED',
      closedAt: new Date()
    }
  })
  
  // Add system message
  await db.ticketMessage.create({
    data: {
      ticketId,
      content: 'تم إغلاق التذكرة من قبل فريق الدعم.',
      isFromAI: true,
      isFromAdmin: true
    }
  })
  
  // Log activity
  await db.activityLog.create({
    data: {
      userId: adminId,
      action: 'close-ticket',
      details: `إغلاق التذكرة ${ticketId}`
    }
  })
  
  return NextResponse.json({ success: true, ticket })
}

async function reopenTicket(ticketId: string) {
  const ticket = await db.supportTicket.update({
    where: { id: ticketId },
    data: {
      status: 'OPEN',
      closedAt: null
    }
  })
  
  // Add system message
  await db.ticketMessage.create({
    data: {
      ticketId,
      content: 'تم إعادة فتح التذكرة.',
      isFromAI: true,
      isFromAdmin: true
    }
  })
  
  return NextResponse.json({ success: true, ticket })
}

async function acceptIntervention(ticketId: string, adminId: string) {
  const ticket = await db.supportTicket.update({
    where: { id: ticketId },
    data: {
      status: 'IN_PROGRESS'
    }
  })
  
  // Add system message
  await db.ticketMessage.create({
    data: {
      ticketId,
      content: 'تم قبول طلب التدخل من قبل فريق الدعم. سيتم الرد عليك قريباً.',
      isFromAI: true,
      isFromAdmin: true
    }
  })
  
  // Log activity
  await db.activityLog.create({
    data: {
      userId: adminId,
      action: 'accept-ticket-intervention',
      details: `قبول تدخل التذكرة ${ticketId}`
    }
  })
  
  return NextResponse.json({ success: true, ticket })
}
