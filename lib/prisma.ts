import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

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

// Use PostgreSQL adapter with connection pool settings
const pool = globalForPrisma.pool ?? new Pool({
  connectionString: postgresUrl,
  max: 10, // Maximum connections
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 10000, // Connection timeout 10 seconds
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.pool = pool

const adapter = new PrismaPg(pool)

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
