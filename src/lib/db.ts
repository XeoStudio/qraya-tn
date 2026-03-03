import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Database URL configuration for Supabase/PostgreSQL
const getDatabaseUrl = () => {
  const baseUrl = process.env.DATABASE_URL
  if (!baseUrl) {
    throw new Error('DATABASE_URL is not set')
  }

  // For Vercel/Supabase production - add pgbouncer for connection pooling
  if (baseUrl.includes('supabase') || baseUrl.includes('postgresql')) {
    if (baseUrl.includes('pgbouncer=true')) {
      return baseUrl
    }
    const separator = baseUrl.includes('?') ? '&' : '?'
    return `${baseUrl}${separator}pgbouncer=true&connect_timeout=15`
  }

  return baseUrl
}

// Configure Prisma for PostgreSQL (Supabase in production)
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Test database connection
export async function testConnection() {
  try {
    await db.$connect()
    console.log('✅ Database connected successfully')
    return true
  } catch (error) {
    console.error('❌ Database connection error:', error)
    return false
  }
}
