import { NextRequest, NextResponse } from 'next/server'

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

    // Return simulated search results since we can't access external APIs
    // In a real implementation, this would connect to a search API
    const results = [
      {
        url: `https://example.com/search?q=${encodeURIComponent(query)}`,
        name: `نتائج البحث عن: ${query}`,
        snippet: `معلومات متعلقة بـ "${query}". هذا مثال على نتيجة بحث يمكن استبدالها بنتائج حقيقية من محرك بحث.`
      },
      {
        url: `https://wikipedia.org/search/${encodeURIComponent(query)}`,
        name: `ويكيبيديا - ${query}`,
        snippet: `مقالة موسوعية عن ${query} مع معلومات شاملة ومفصلة.`
      },
      {
        url: `https://education.tn/${encodeURIComponent(query)}`,
        name: `الموقع التعليمي التونسي - ${query}`,
        snippet: `موارد تعليمية تونسية متعلقة بـ ${query} للطلاب والأساتذة.`
      }
    ].slice(0, num)

    return NextResponse.json({
      success: true,
      results,
      note: 'هذه نتائج تجريبية. للبحث الفعلي، يلزم ربط الخدمة بمحرك بحث.'
    })

  } catch (error) {
    console.error('Web search error:', error)
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ أثناء البحث'
    }, { status: 500 })
  }
}
