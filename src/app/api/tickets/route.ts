import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateSupportResponse } from '@/lib/ai-service'

// Helper to get current user from session
async function getCurrentUser(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value
  if (!token) return null

  const session = await db.session.findUnique({
    where: { token },
    include: { user: { include: { subscription: true } } }
  })

  if (!session || session.expiresAt < new Date()) {
    return null
  }

  return session.user
}

// GET - Fetch user's tickets
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
    }

    const tickets = await db.supportTicket.findMany({
      where: { userId: user.id },
      include: {
        messages: {
          include: {
            user: {
              select: { name: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, tickets })
  } catch {
    return NextResponse.json({ success: false, error: 'حدث خطأ' }, { status: 500 })
  }
}

// POST - Create new ticket
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
    }

    const { title, category, message } = await req.json()

    if (!title?.trim() || !message?.trim()) {
      return NextResponse.json({ success: false, error: 'العنوان والرسالة مطلوبان' }, { status: 400 })
    }

    // Create ticket with initial message
    const ticket = await db.supportTicket.create({
      data: {
        userId: user.id,
        title: title.trim(),
        category: category || 'GENERAL',
        status: 'OPEN',
        priority: 'MEDIUM',
        messages: {
          create: {
            userId: user.id,
            content: message.trim(),
            isFromAI: false,
            isFromAdmin: false
          }
        }
      },
      include: {
        messages: {
          include: {
            user: {
              select: { name: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    // Build user profile for AI
    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      level: user.level,
      levelName: user.levelName,
      year: user.year,
      section: user.section,
      governorate: user.governorate,
      subjects: user.subjects,
      points: user.points,
      streak: user.streak,
      role: user.role,
      subscription: user.subscription ? {
        plan: user.subscription.plan,
        status: user.subscription.status,
        agentMode: user.subscription.agentMode,
        advancedAI: user.subscription.advancedAI
      } : null
    }

    // Generate AI response
    const aiResponse = await generateSupportResponse(title, message, category || 'GENERAL', userProfile)

    // Add AI response
    await db.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        content: aiResponse,
        isFromAI: true,
        isFromAdmin: false
      }
    })

    // Update ticket status
    await db.supportTicket.update({
      where: { id: ticket.id },
      data: { status: 'IN_PROGRESS' }
    })

    // Fetch updated ticket
    const updatedTicket = await db.supportTicket.findUnique({
      where: { id: ticket.id },
      include: {
        messages: {
          include: {
            user: {
              select: { name: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    return NextResponse.json({ success: true, ticket: updatedTicket })
  } catch {
    return NextResponse.json({ success: false, error: 'حدث خطأ' }, { status: 500 })
  }
}

// PUT - Add reply to ticket
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
    }

    const { ticketId, message } = await req.json()

    if (!ticketId || !message?.trim()) {
      return NextResponse.json({ success: false, error: 'بيانات ناقصة' }, { status: 400 })
    }

    // Verify ticket ownership
    const ticket = await db.supportTicket.findUnique({
      where: { id: ticketId }
    })

    if (!ticket || ticket.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'التذكرة غير موجودة' }, { status: 404 })
    }

    if (ticket.status === 'CLOSED') {
      return NextResponse.json({ success: false, error: 'التذكرة مغلقة' }, { status: 400 })
    }

    // Add user message
    await db.ticketMessage.create({
      data: {
        ticketId,
        userId: user.id,
        content: message.trim(),
        isFromAI: false,
        isFromAdmin: false
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

    // Build user profile for AI
    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      level: user.level,
      levelName: user.levelName,
      year: user.year,
      section: user.section,
      governorate: user.governorate,
      subjects: user.subjects,
      points: user.points,
      streak: user.streak,
      role: user.role,
      subscription: user.subscription ? {
        plan: user.subscription.plan,
        status: user.subscription.status,
        agentMode: user.subscription.agentMode,
        advancedAI: user.subscription.advancedAI
      } : null
    }

    // Generate AI response
    const aiResponse = await generateSupportResponse(ticket.title, message, ticket.category, userProfile)

    // Add AI response
    await db.ticketMessage.create({
      data: {
        ticketId,
        content: aiResponse,
        isFromAI: true,
        isFromAdmin: false
      }
    })

    // Fetch updated ticket
    const updatedTicket = await db.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        messages: {
          include: {
            user: {
              select: { name: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    return NextResponse.json({ success: true, ticket: updatedTicket })
  } catch {
    return NextResponse.json({ success: false, error: 'حدث خطأ' }, { status: 500 })
  }
}

// PATCH - Update ticket (request human, rate, close)
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 })
    }

    const { ticketId, action, rating, feedback } = await req.json()

    if (!ticketId || !action) {
      return NextResponse.json({ success: false, error: 'بيانات ناقصة' }, { status: 400 })
    }

    // Verify ticket ownership
    const ticket = await db.supportTicket.findUnique({
      where: { id: ticketId }
    })

    if (!ticket || ticket.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'التذكرة غير موجودة' }, { status: 404 })
    }

    let updateData: Record<string, unknown> = {}

    switch (action) {
      case 'request_human':
        updateData = {
          needsHumanIntervention: true,
          status: 'IN_PROGRESS'
        }
        await db.ticketMessage.create({
          data: {
            ticketId,
            content: 'تم طلب تدخل فريق الدعم. سيتم الرد عليك من قبل أحد المسؤولين قريباً.',
            isFromAI: true,
            isFromAdmin: false
          }
        })
        break

      case 'rate':
        if (rating && rating >= 1 && rating <= 5) {
          updateData = {
            rating,
            feedback: feedback?.trim() || null,
            status: 'CLOSED',
            closedAt: new Date()
          }
        }
        break

      case 'close':
        updateData = {
          status: 'CLOSED',
          closedAt: new Date()
        }
        break

      default:
        return NextResponse.json({ success: false, error: 'إجراء غير صالح' }, { status: 400 })
    }

    await db.supportTicket.update({
      where: { id: ticketId },
      data: updateData
    })

    const updatedTicket = await db.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        messages: {
          include: {
            user: {
              select: { name: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    return NextResponse.json({ success: true, ticket: updatedTicket })
  } catch {
    return NextResponse.json({ success: false, error: 'حدث خطأ' }, { status: 500 })
  }
}
