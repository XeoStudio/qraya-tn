import { db } from '@/lib/db'
import { hash } from 'bcryptjs'

const SUPER_ADMIN_EMAIL = 'wissemlahkiri2@gmail.com'

async function main() {
  console.log('🔧 Fixing super admin privileges...')

  // Find or create the super admin
  let user = await db.user.findUnique({
    where: { email: SUPER_ADMIN_EMAIL.toLowerCase() },
    include: { subscription: true }
  })

  if (!user) {
    console.log('📝 Creating super admin account...')
    const hashedPassword = await hash('admin123', 12)
    
    user = await db.user.create({
      data: {
        email: SUPER_ADMIN_EMAIL.toLowerCase(),
        name: 'Wissem Lahkiri',
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
        isVerified: true,
        points: 9999,
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
    console.log('✅ Super admin created!')
  } else {
    console.log('🔄 Updating existing user to super admin...')
    
    // Update user role
    user = await db.user.update({
      where: { id: user.id },
      data: {
        role: 'ADMIN',
        status: 'ACTIVE',
        isVerified: true
      },
      include: { subscription: true }
    })

    // Update or create subscription
    if (user.subscription) {
      await db.subscription.update({
        where: { id: user.subscription.id },
        data: {
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
      })
    } else {
      await db.subscription.create({
        data: {
          userId: user.id,
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
      })
    }
    
    console.log('✅ Super admin updated!')
  }

  // Verify
  const verifiedUser = await db.user.findUnique({
    where: { email: SUPER_ADMIN_EMAIL.toLowerCase() },
    include: { subscription: true }
  })

  console.log('')
  console.log('📊 User Status:')
  console.log(`   Email: ${verifiedUser?.email}`)
  console.log(`   Name: ${verifiedUser?.name}`)
  console.log(`   Role: ${verifiedUser?.role}`)
  console.log(`   Status: ${verifiedUser?.status}`)
  console.log(`   Plan: ${verifiedUser?.subscription?.plan}`)
  console.log(`   Unlimited Chat: ${verifiedUser?.subscription?.unlimitedChat}`)
  console.log('')
  console.log('🎉 Done! Please log out and log in again.')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
