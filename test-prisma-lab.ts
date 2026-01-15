import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({})
async function main() {
    try {
        console.log("Attempting to access prisma.lab...")
        // @ts-ignore
        if (!prisma.lab) {
            console.error("prisma.lab is UNDEFINED. The client might not have been regenerated.")
            return
        }
        // @ts-ignore
        const labs = await prisma.lab.findMany()
        console.log('Success! Labs count:', labs.length)
    } catch (e) {
        console.error("Error accessing Lab model:", e)
    } finally {
        await prisma.$disconnect()
    }
}
main()
