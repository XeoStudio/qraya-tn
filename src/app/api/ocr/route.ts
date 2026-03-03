import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// OCR endpoint - Extract text from images
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ success: false, error: 'يرجى تسجيل الدخول أولاً' }, { status: 401 })
    }

    const session = await db.session.findUnique({
      where: { token },
      include: { user: { include: { subscription: true } } }
    })

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ success: false, error: 'الجلسة منتهية' }, { status: 401 })
    }

    const body = await request.json()
    const { image } = body as { image: string }

    if (!image) {
      return NextResponse.json({ success: false, error: 'الصورة مطلوبة' }, { status: 400 })
    }

    const user = session.user
    const subscription = user.subscription
    
    // Check OCR quota for free users
    if (subscription?.plan === 'FREE' || !subscription) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const todayUsage = await db.activityLog.count({
        where: {
          userId: user.id,
          action: 'ocr',
          createdAt: { gte: today }
        }
      })
      
      const dailyLimit = 3
      if (todayUsage >= dailyLimit) {
        return NextResponse.json({
          success: false,
          error: `لقد استنفذت حدك اليومي (${dailyLimit} صور). قم بالترقية للمزيد.`
        }, { status: 429 })
      }
    }

    // Call Vision API to extract text
    const response = await fetch('https://ktai.koyeb.app/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sk-EtZogv60anr2rPKdFjtbAVVC56ix6Pupnu0V6KfD2JCZVvet'
      },
      body: JSON.stringify({
        model: 'ktai-inc-provider1/gpt-5.2',
        messages: [
          {
            role: 'system',
            content: 'أنت أداة OCR. استخرج كل النص من الصورة بدقة.'
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'استخرج كل النص من هذه الصورة:' },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image}` } }
            ]
          }
        ],
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        text: '[تم رفع الصورة]'
      })
    }

    const data = await response.json()
    const extractedText = data.choices?.[0]?.message?.content || ''

    // Log OCR usage
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: 'ocr',
        details: 'استخراج نص من صورة'
      }
    })

    await db.user.update({
      where: { id: user.id },
      data: { points: { increment: 1 } }
    })

    return NextResponse.json({
      success: true,
      text: extractedText
    })

  } catch (error) {
    console.error('OCR error:', error)
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ في معالجة الصورة'
    }, { status: 500 })
  }
}
