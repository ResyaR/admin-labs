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

