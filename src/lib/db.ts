import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Database URL configuration
const getDatabaseUrl = (): string => {
  const baseUrl = process.env.DATABASE_URL
  
  if (!baseUrl) {
    console.error('DATABASE_URL is not set!')
    throw new Error('DATABASE_URL is not configured')
  }

  // For SQLite, return as is
  if (baseUrl.startsWith('file:')) {
    return baseUrl
  }

  // For PostgreSQL (Supabase), add pgbouncer if not present
  if (baseUrl.includes('supabase') || baseUrl.includes('postgresql')) {
    if (baseUrl.includes('pgbouncer=true')) {
      return baseUrl
    }
    const separator = baseUrl.includes('?') ? '&' : '?'
    return `${baseUrl}${separator}pgbouncer=true&connect_timeout=15`
  }

  return baseUrl
}

// Create Prisma client with error handling
function createPrismaClient(): PrismaClient {
  try {
    const databaseUrl = getDatabaseUrl()
    
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'error', 'warn'] 
        : ['error'],
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    })
  } catch (error) {
    console.error('Failed to create Prisma client:', error)
    throw error
  }
}

// Export singleton instance
export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

// Test database connection with retry
export async function testConnection(retries = 3): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      await db.$connect()
      console.log('✅ Database connected successfully')
      return true
    } catch (error) {
      console.error(`❌ Database connection attempt ${i + 1} failed:`, error)
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
  }
  return false
}

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    try {
      await db.$disconnect()
      console.log('📊 Database disconnected')
    } catch (error) {
      console.error('Error disconnecting from database:', error)
    }
  })
}
