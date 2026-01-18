import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

// POST /api/pcs - Menerima data dari spec-detector
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validasi data minimal
    if (!body.hostname) {
      return NextResponse.json(
        { success: false, error: 'Hostname is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const hostname = body.hostname

    // Cek apakah PC sudah ada
    const existingPC = await prisma.pC.findUnique({
      where: { hostname },
      include: {
        cpu: true,
        gpu: true,
        motherboard: true,
        rams: true,
        storages: true,
        networks: true,
      },
    })

    if (!existingPC) {
      // PC baru - buat entry pertama sebagai baseline
      return await createNewPC(body)
    } else {
      // PC sudah ada - cek perubahan dan update
      return await updateExistingPC(existingPC, body)
    }
  } catch (error) {
    console.error('Error processing PC data:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// GET /api/pcs - Mengambil daftar semua PC (optimized for list view)
export async function GET() {
  try {
    // Passive Cleanup: Mark active PCs as offline if they haven't synced for 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    await prisma.pC.updateMany({
      where: {
        status: 'active',
        lastSeen: { lt: oneDayAgo },
      },
      data: {
        status: 'offline',
      },
    })

    const pcs = await prisma.pC.findMany({
      select: {
        id: true,
        hostname: true,
        brand: true,
        os: true,
        osVersion: true,
        location: true,
        status: true,
        lastSeen: true,
        createdAt: true,
        updatedAt: true,
        // Only load essential fields from related tables
        cpu: {
          select: {
            model: true,
            cores: true,
            clock: true,
          },
        },
        // For list view, we only need counts and basic info
        rams: {
          select: {
            capacity: true,
            type: true,
          },
        },
        storages: {
          select: {
            size: true,
            type: true,
          },
        },
        // Count of critical changes
        _count: {
          select: {
            changes: {
              where: {
                severity: { in: ['warning', 'critical'] },
                createdAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                },
              },
            },
          },
        },
      },
      orderBy: {
        lastSeen: 'desc',
      },
    })

    return NextResponse.json({ success: true, data: pcs }, { headers: corsHeaders })
  } catch (error) {
    console.error('Error fetching PCs:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// Fungsi untuk membuat PC baru (baseline)
async function createNewPC(spec: any) {
  const pc = await prisma.pC.create({
    data: {
      hostname: spec.hostname,
      brand: spec.brand || null,
      os: spec.os || null,
      osVersion: spec.osVersion || null,
      osBuild: spec.osBuild || null,
      arch: spec.arch || null,
      status: 'active',
      lastSeen: new Date(),
      cpu: spec.cpuModel ? {
        create: {
          model: spec.cpuModel,
          cores: spec.cpuCores || 0,
          clock: spec.cpuClock || null,
        },
      } : undefined,
      gpu: spec.gpu ? {
        create: {
          model: spec.gpu,
        },
      } : undefined,
      motherboard: spec.motherboard ? {
        create: {
          model: spec.motherboard,
          serialNumber: spec.motherboardSerial || null,
        },
      } : undefined,
      rams: spec.ramDetails && spec.ramDetails.length > 0 ? {
        create: spec.ramDetails.map((ram: any, index: number) => ({
          manufacturer: ram.manufacturer || null,
          model: ram.model || null,
          capacity: ram.capacity || null,
          speed: ram.speed || null,
          type: ram.type || null,
          formFactor: ram.formFactor || null,
          serialNumber: ram.serialNumber || null,
          bankLabel: ram.bank || null,
          slotIndex: index,
        })),
      } : undefined,
      storages: spec.storageDetails && spec.storageDetails.length > 0 ? {
        create: spec.storageDetails.map((storage: any, index: number) => ({
          manufacturer: storage.manufacturer || null,
          model: storage.model || null,
          size: storage.size || null,
          interface: storage.interface || null,
          type: storage.type || null,
          serialNumber: storage.serialNumber || null,
          diskIndex: index,
        })),
      } : undefined,
      networks: spec.interfaces && spec.interfaces.length > 0 ? {
        create: spec.interfaces.map((net: any) => ({
          name: net.name || 'Unknown',
          macAddr: net.macAddr || null,
          ipv4: net.ipv4 || null,
          isUp: net.isUp !== undefined ? net.isUp : true,
          bandwidth: net.bandwidth || null,
        })),
      } : undefined,
    },
    include: {
      cpu: true,
      gpu: true,
      motherboard: true,
      rams: true,
      storages: true,
      networks: true,
    },
  })

  return NextResponse.json({
    success: true,
    message: 'PC registered as baseline',
    data: pc,
  }, { headers: corsHeaders })
}

// Fungsi untuk update PC yang sudah ada dan deteksi perubahan
async function updateExistingPC(existingPC: any, newSpec: any) {
  const changes: any[] = []

  // Determine new status: auto-recover from 'offline' to 'active'
  const newStatus = existingPC.status === 'offline' ? 'active' : existingPC.status

  // Update basic info
  await prisma.pC.update({
    where: { id: existingPC.id },
    data: {
      brand: newSpec.brand || existingPC.brand,
      os: newSpec.os || existingPC.os,
      osVersion: newSpec.osVersion || existingPC.osVersion,
      osBuild: newSpec.osBuild || existingPC.osBuild,
      arch: newSpec.arch || existingPC.arch,
      status: newStatus,
      lastSeen: new Date(),
    },
  })

  // 1. Check CPU
  if (newSpec.cpuModel && existingPC.cpu) {
    if (existingPC.cpu.model !== newSpec.cpuModel) {
      const existingWarning = await prisma.componentChange.findFirst({
        where: { pcId: existingPC.id, componentType: 'cpu', severity: 'warning' },
        orderBy: { createdAt: 'desc' }
      })
      if (!existingWarning || existingWarning.newValue !== newSpec.cpuModel) {
        changes.push({
          pcId: existingPC.id, componentType: 'cpu', changeType: 'modified',
          oldValue: existingPC.cpu.model, newValue: newSpec.cpuModel,
          message: `Hardware Mismatch: Actual CPU ("${newSpec.cpuModel}") vs Baseline ("${existingPC.cpu.model}")`,
          severity: 'warning',
        })
      }
    } else {
      await prisma.componentChange.deleteMany({
        where: { pcId: existingPC.id, componentType: 'cpu', severity: 'warning' }
      })
    }
  }

  // 2. Check GPU
  if (newSpec.gpu && existingPC.gpu) {
    if (existingPC.gpu.model !== newSpec.gpu) {
      const existingWarning = await prisma.componentChange.findFirst({
        where: { pcId: existingPC.id, componentType: 'gpu', severity: 'warning' },
        orderBy: { createdAt: 'desc' }
      })
      if (!existingWarning || existingWarning.newValue !== newSpec.gpu) {
        changes.push({
          pcId: existingPC.id, componentType: 'gpu', changeType: 'modified',
          oldValue: existingPC.gpu.model, newValue: newSpec.gpu,
          message: `Hardware Mismatch: Actual GPU ("${newSpec.gpu}") vs Baseline ("${existingPC.gpu.model}")`,
          severity: 'warning',
        })
      }
    } else {
      await prisma.componentChange.deleteMany({
        where: { pcId: existingPC.id, componentType: 'gpu', severity: 'warning' }
      })
    }
  }

  // 3. Check Motherboard
  if (newSpec.motherboard && existingPC.motherboard) {
    if (existingPC.motherboard.model !== newSpec.motherboard) {
      const existingWarning = await prisma.componentChange.findFirst({
        where: { pcId: existingPC.id, componentType: 'motherboard', severity: 'warning' },
        orderBy: { createdAt: 'desc' }
      })
      if (!existingWarning || existingWarning.newValue !== newSpec.motherboard) {
        changes.push({
          pcId: existingPC.id, componentType: 'motherboard', changeType: 'modified',
          oldValue: existingPC.motherboard.model, newValue: newSpec.motherboard,
          message: `Hardware Mismatch: Actual Board ("${newSpec.motherboard}") vs Baseline ("${existingPC.motherboard.model}")`,
          severity: 'warning',
        })
      }
    } else {
      await prisma.componentChange.deleteMany({
        where: { pcId: existingPC.id, componentType: 'motherboard', severity: 'warning' }
      })
    }
  }

  // 4. Check RAM
  if (newSpec.ramDetails && newSpec.ramDetails.length > 0 && existingPC.rams.length > 0) {
    const baselineRAM = existingPC.rams[0].capacity;
    const actualRAM = newSpec.ramDetails[0].capacity;

    if (baselineRAM !== actualRAM) {
      const existingWarning = await prisma.componentChange.findFirst({
        where: { pcId: existingPC.id, componentType: 'ram', severity: 'warning' },
        orderBy: { createdAt: 'desc' }
      })
      if (!existingWarning || existingWarning.newValue !== actualRAM) {
        changes.push({
          pcId: existingPC.id, componentType: 'ram', changeType: 'modified',
          oldValue: baselineRAM, newValue: actualRAM,
          message: `Hardware Mismatch: Actual RAM ("${actualRAM}") vs Baseline ("${baselineRAM}")`,
          severity: 'warning',
        })
      }
    } else {
      await prisma.componentChange.deleteMany({
        where: { pcId: existingPC.id, componentType: 'ram', severity: 'warning' }
      })
    }
  }

  // Update lastSeen and other non-component info
  await prisma.pC.update({
    where: { id: existingPC.id },
    data: {
      brand: newSpec.brand || existingPC.brand,
      os: newSpec.os || existingPC.os,
      osVersion: newSpec.osVersion || existingPC.osVersion,
      status: newStatus,
      lastSeen: new Date(),
    },
  })

  // Simpan semua peringatan baru
  if (changes.length > 0) {
    await prisma.componentChange.createMany({
      data: changes,
    })
  }

  // Ambil PC yang sudah diupdate
  const updatedPC = await prisma.pC.findUnique({
    where: { id: existingPC.id },
    include: {
      cpu: true,
      gpu: true,
      motherboard: true,
      rams: true,
      storages: true,
      networks: true,
      changes: {
        where: {
          severity: { in: ['warning', 'critical'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  return NextResponse.json({
    success: true,
    message: changes.length > 0 ? `${changes.length} component change(s) detected` : 'PC updated successfully',
    data: updatedPC,
    changes: changes.length,
  }, { headers: corsHeaders })
}
