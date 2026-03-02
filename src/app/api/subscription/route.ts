import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value
    
    if (!token) {
      return NextResponse.json({ success: false, error: 'غير مصادق' }, { status: 401 })
    }
    
    const session = await db.session.findUnique({
      where: { token },
      include: { user: { include: { subscription: true } } }
    })
    
    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ success: false, error: 'الجلسة منتهية' }, { status: 401 })
    }
    
    const body = await request.json()
    const { code } = body
    
    if (!code) {
      return NextResponse.json({ success: false, error: 'كود التفعيل مطلوب' }, { status: 400 })
    }
    
    // Find promo code
    const promoCode = await db.promoCode.findUnique({
      where: { code: code.toUpperCase(), isActive: true }
    })
    
    if (!promoCode) {
      return NextResponse.json({ success: false, error: 'كود التفعيل غير صالح' }, { status: 400 })
    }
    
    // Check if expired
    if (promoCode.expiresAt && promoCode.expiresAt < new Date()) {
      return NextResponse.json({ success: false, error: 'كود التفعيل منتهي الصلاحية' }, { status: 400 })
    }
    
    // Check max uses
    if (promoCode.maxUses && promoCode.usedCount >= promoCode.maxUses) {
      return NextResponse.json({ success: false, error: 'تم استخدام هذا الكود الحد الأقصى' }, { status: 400 })
    }
    
    // Check if already used by this user
    const existingUsage = await db.promoCodeUsage.findFirst({
      where: { codeId: promoCode.id, userId: session.user.id }
    })
    
    if (existingUsage) {
      return NextResponse.json({ success: false, error: 'لقد استخدمت هذا الكود مسبقاً' }, { status: 400 })
    }
    
    const user = session.user
    const subscription = user.subscription
    
    // Calculate end date
    let endDate: Date | null = null
    if (promoCode.duration) {
      endDate = new Date(Date.now() + promoCode.duration * 24 * 60 * 60 * 1000)
    }
    
    // Update or create subscription
    if (subscription) {
      await db.subscription.update({
        where: { id: subscription.id },
        data: {
          plan: promoCode.planType,
          status: 'ACTIVE',
          endDate,
          agentMode: promoCode.agentMode,
          advancedAI: promoCode.advancedAI,
          unlimitedChat: promoCode.unlimitedChat,
          priority: promoCode.priority,
          exportPDF: promoCode.exportPDF,
          ocrUnlimited: promoCode.ocrUnlimited,
          customPlans: promoCode.customPlans,
          quotaLimit: promoCode.unlimitedChat ? 999999 : 50
        }
      })
    } else {
      await db.subscription.create({
        data: {
          userId: user.id,
          plan: promoCode.planType,
          status: 'ACTIVE',
          endDate,
          agentMode: promoCode.agentMode,
          advancedAI: promoCode.advancedAI,
          unlimitedChat: promoCode.unlimitedChat,
          priority: promoCode.priority,
          exportPDF: promoCode.exportPDF,
          ocrUnlimited: promoCode.ocrUnlimited,
          customPlans: promoCode.customPlans,
          quotaLimit: promoCode.unlimitedChat ? 999999 : 50
        }
      })
    }
    
    // Update user role
    if (promoCode.planType === 'PREMIUM' || promoCode.planType === 'LIFETIME') {
      await db.user.update({
        where: { id: user.id },
        data: { role: 'PREMIUM', points: { increment: 50 } }
      })
    }
    
    // Record usage
    await db.promoCodeUsage.create({
      data: {
        codeId: promoCode.id,
        userId: user.id
      }
    })
    
    // Increment used count
    await db.promoCode.update({
      where: { id: promoCode.id },
      data: { usedCount: { increment: 1 } }
    })
    
    // Create achievement
    await db.achievement.create({
      data: {
        userId: user.id,
        type: 'subscription',
        title: `تم تفعيل خطة ${promoCode.planType}! 🎉`,
        description: 'مبارك! تم تفعيل اشتراكك بنجاح'
      }
    })
    
    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: 'activate-promo',
        details: `تم تفعيل كود ${code} - ${promoCode.planType}`
      }
    })
    
    return NextResponse.json({ 
      success: true, 
      message: `تم تفعيل خطة ${promoCode.planType} بنجاح!`,
      plan: promoCode.planType
    })
  } catch (error) {
    console.error('Subscription error:', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ' }, { status: 500 })
  }
}
