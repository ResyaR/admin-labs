import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/pcs/[id] - Mengambil detail lengkap PC
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const pc = await prisma.pC.findUnique({
      where: { id },
      include: {
        cpu: true,
        gpu: true,
        motherboard: true,
        rams: {
          orderBy: { slotIndex: 'asc' },
        },
        storages: {
          orderBy: { diskIndex: 'asc' },
        },
        networks: {
          orderBy: { name: 'asc' },
        },
        changes: {
          where: {
            severity: { in: ['warning', 'critical'] },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!pc) {
      return NextResponse.json(
        { success: false, error: 'PC not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: pc })
  } catch (error) {
    console.error('Error fetching PC detail:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/pcs/[id] - Menghapus PC
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Cek apakah PC ada
    const pc = await prisma.pC.findUnique({
      where: { id },
    })

    if (!pc) {
      return NextResponse.json(
        { success: false, error: 'PC not found' },
        { status: 404 }
      )
    }

    // Hapus PC (cascade delete akan menghapus semua relasi)
    await prisma.pC.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'PC deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting PC:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/pcs/[id] - Update PC details
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { location, status, cpuModel, ramCapacity } = body

    const updatedPC = await prisma.$transaction(async (tx: any) => {
      // 1. Update basic PC info
      const pc = await tx.pC.update({
        where: { id },
        data: {
          location: location !== undefined ? location : undefined,
          status: status !== undefined ? status : undefined,
        },
      })

      // 2. Update CPU if provided
      if (cpuModel) {
        await tx.cPU.updateMany({
          where: { pcId: id },
          data: { model: cpuModel }
        })
      }

      // 3. Update RAM if provided (update first slot for simplicity)
      if (ramCapacity) {
        const firstRam = await tx.rAM.findFirst({
          where: { pcId: id },
          orderBy: { slotIndex: 'asc' }
        })
        if (firstRam) {
          await tx.rAM.update({
            where: { id: firstRam.id },
            data: { capacity: ramCapacity }
          })
        }
      }

      return pc
    })

    return NextResponse.json({ success: true, data: updatedPC })
  } catch (error) {
    console.error('Error updating PC:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
