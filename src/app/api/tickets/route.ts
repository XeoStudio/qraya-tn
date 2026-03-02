import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

// Helper to get current user from session
async function getCurrentUser(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value
  if (!token) return null

  const session = await db.session.findUnique({
    where: { token },
    include: { user: true }
  })

  if (!session || session.expiresAt < new Date()) {
    return null
  }

  return session.user
}

// Generate AI response for ticket
async function generateAIResponse(ticketTitle: string, ticketMessage: string, category: string): Promise<string> {
  try {
    const zai = await ZAI.create()

    const systemPrompt = `أنت مساعد دعم فني لموقع "مساعد دراسة تونسي" - منصة تعليمية للطلاب التونسيين.
    
    قواعد الرد:
    1. كن ودوداً ومحترفاً
    2. أجب بالعربية الفصحى
    3. إذا كان السؤال تقني، قدم حلولاً خطوة بخطوة
    4. إذا كان عن الاشتراكات، اشرح خطط الأسعار
    5. إذا لم تتمكن من حل المشكلة، اقترح طلب تدخل يدوي
    
    خطط الأسعار:
    - مجاني: 10 محادثات، 3 OCR يومياً
    - أساسي (9.99 DT/شهر): 50 محادثة، 20 OCR، وضع المعلم
    - متقدم (19.99 DT/شهر): غير محدود + ميزات متقدمة
    - باك برو (29.99 DT/شهر لـ 4 أشهر): للمتقدمين للباكالوريا
    
    للتواصل: +216 24 239 724 (واتساب)`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `عنوان التذكرة: ${ticketTitle}\nالتصنيف: ${category}\n\nرسالة المستخدم: ${ticketMessage}` }
      ],
      temperature: 0.7,
      max_tokens: 500
    })

    return completion.choices[0]?.message?.content || 'شكراً لتواصلك معنا. سيتم الرد عليك قريباً.'
  } catch {
    return 'شكراً لتواصلك معنا. تم استلام رسالتك وسيتم الرد عليك في أقرب وقت ممكن.'
  }
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

    // Generate AI response
    const aiResponse = await generateAIResponse(title, message, category || 'GENERAL')

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

    // Generate AI response
    const lastMessages = await db.ticketMessage.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'desc' },
      take: 3
    })

    const context = lastMessages.reverse().map(m => 
      `${m.isFromAI ? 'المساعد' : 'المستخدم'}: ${m.content}`
    ).join('\n')

    const aiResponse = await generateAIResponse(ticket.title, context, ticket.category)

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
        // Add system message
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
