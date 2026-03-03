import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const adminPassword = await hash('admin123', 12)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tunisianstudy.tn' },
    update: {},
    create: {
      email: 'admin@tunisianstudy.tn',
      name: 'المدير',
      password: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      isVerified: true,
      subscription: {
        create: {
          plan: 'BAC_PRO',
          status: 'ACTIVE',
          agentMode: true,
          advancedAI: true,
          unlimitedChat: true,
          priority: true,
          exportPDF: true,
          ocrUnlimited: true,
          customPlans: true,
          quotaLimit: 999999
        }
      }
    },
    include: { subscription: true }
  })

  console.log('✅ Admin user created:', admin.email)

  // Create some demo promo codes
  const promoCodes = [
    { code: 'WELCOME2025', planType: 'BASIC' as const, duration: 30, maxUses: 100 },
    { code: 'PREMIUM50', planType: 'PREMIUM' as const, duration: 30, maxUses: 50 },
    { code: 'BACPRO10', planType: 'BAC_PRO' as const, maxUses: 10 },
  ]

  for (const promo of promoCodes) {
    await prisma.promoCode.upsert({
      where: { code: promo.code },
      update: {},
      create: {
        ...promo,
        agentMode: true,
        advancedAI: promo.planType !== 'BASIC',
        unlimitedChat: promo.planType !== 'BASIC',
        priority: promo.planType !== 'BASIC',
        exportPDF: promo.planType !== 'BASIC',
        ocrUnlimited: promo.planType === 'BAC_PRO',
        customPlans: promo.planType === 'BAC_PRO',
        createdBy: admin.id
      }
    })
    console.log(`✅ Promo code created: ${promo.code}`)
  }

  console.log('🎉 Seeding complete!')
  console.log('')
  console.log('📋 Admin credentials:')
  console.log('   Email: admin@tunisianstudy.tn')
  console.log('   Password: admin123')
  console.log('')
  console.log('🎫 Demo promo codes:')
  console.log('   WELCOME2025 - BASIC plan (30 days)')
  console.log('   PREMIUM50 - PREMIUM plan (30 days)')
  console.log('   BACPRO10 - BAC_PRO plan')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
