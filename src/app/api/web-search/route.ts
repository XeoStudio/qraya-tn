import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { webSearch } from '@/lib/ai-service'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'يرجى تسجيل الدخول أولاً'
      }, { status: 401 })
    }

    const session = await db.session.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({
        success: false,
        error: 'الجلسة منتهية'
      }, { status: 401 })
    }

    const body = await request.json()
    const { query, num = 5 } = body

    if (!query) {
      return NextResponse.json({
        success: false,
        error: 'يرجى إدخال كلمة البحث'
      }, { status: 400 })
    }

    const user = session.user

    // Build user profile for contextual search
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
      subscription: null
    }

    // Execute web search with Tunisian context
    const result = await webSearch(query, userProfile, num)

    if (!result.success || !result.results) {
      return NextResponse.json({
        success: false,
        error: result.error || 'لم يتم العثور على نتائج'
      })
    }

    return NextResponse.json({
      success: true,
      results: result.results
    })

  } catch (error) {
    console.error('Web search error:', error)
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ أثناء البحث'
    }, { status: 500 })
  }
}
