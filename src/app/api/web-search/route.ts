import { NextRequest, NextResponse } from 'next/server'
import { getZAI } from '@/lib/zai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, num = 5 } = body

    if (!query) {
      return NextResponse.json({ 
        success: false, 
        error: 'يرجى إدخال كلمة البحث' 
      }, { status: 400 })
    }

    // البحث في الإنترنت باستخدام z-ai-web-dev-sdk
    const zai = await getZAI()
    
    const searchResult = await zai.functions.invoke("web_search", {
      query,
      num
    })

    if (!searchResult || !Array.isArray(searchResult)) {
      return NextResponse.json({ 
        success: false, 
        error: 'لم يتم العثور على نتائج' 
      }, { status: 404 })
    }

    // تنسيق النتائج
    const results = searchResult.map((item: {
      url: string
      name: string
      snippet: string
    }) => ({
      url: item.url,
      name: item.name || new URL(item.url).hostname,
      snippet: item.snippet || ''
    }))

    return NextResponse.json({ 
      success: true, 
      results 
    })

  } catch (error) {
    console.error('Web search error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'حدث خطأ أثناء البحث' 
    }, { status: 500 })
  }
}
