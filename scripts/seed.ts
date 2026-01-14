import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

// Extract PostgreSQL URL from Prisma Accelerate URL if needed
const databaseUrl = process.env.DATABASE_URL || ''
let postgresUrl = databaseUrl

// If using Prisma Accelerate format, extract the actual PostgreSQL URL
if (databaseUrl.startsWith('prisma+postgres://')) {
  // For Prisma Accelerate, we can use accelerateUrl directly
  // But for adapter, we need the actual PostgreSQL URL
  // Try to extract from the URL or use as is
  postgresUrl = databaseUrl.replace('prisma+postgres://', 'postgresql://')
}

// Use PostgreSQL adapter
const pool = new Pool({ connectionString: postgresUrl })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({ adapter })

async function main() {
  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@admin.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'admin',
    },
  })

  console.log('Created admin user:', admin)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

