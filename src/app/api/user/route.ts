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
      include: { user: true }
    })
    
    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ success: false, error: 'الجلسة منتهية' }, { status: 401 })
    }
    
    const body = await request.json()
    const { action, name, level, year, section } = body
    
    switch (action) {
      case 'update-profile':
        const updateData: { name?: string; level?: string; levelName?: string; year?: string; section?: string } = {}
        
        if (name) updateData.name = name
        if (level) {
          updateData.level = level
          const levelNames: Record<string, string> = {
            'primary': 'الابتدائي',
            'preparatory': 'الإعدادي',
            'secondary': 'الثانوي',
            'bac': 'الباكالوريا'
          }
          updateData.levelName = levelNames[level] || level
        }
        if (year) updateData.year = year
        if (section) updateData.section = section
        
        const user = await db.user.update({
          where: { id: session.user.id },
          data: updateData
        })
        
        return NextResponse.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            level: user.level,
            levelName: user.levelName,
            year: user.year,
            section: user.section,
            role: user.role,
            points: user.points,
            streak: user.streak
          }
        })
      
      default:
        return NextResponse.json({ success: false, error: 'إجراء غير معروف' }, { status: 400 })
    }
  } catch (error) {
    console.error('User API error:', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ' }, { status: 500 })
  }
}
