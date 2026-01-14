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

// GET /api/pcs - Mengambil daftar semua PC
export async function GET() {
  try {
    const pcs = await prisma.pC.findMany({
      include: {
        cpu: true,
        gpu: true,
        motherboard: true,
        rams: true,
        storages: true,
        networks: true,
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

  // Update basic info
  await prisma.pC.update({
    where: { id: existingPC.id },
    data: {
      brand: newSpec.brand || existingPC.brand,
      os: newSpec.os || existingPC.os,
      osVersion: newSpec.osVersion || existingPC.osVersion,
      osBuild: newSpec.osBuild || existingPC.osBuild,
      arch: newSpec.arch || existingPC.arch,
      lastSeen: new Date(),
    },
  })

  // Cek perubahan CPU
  if (newSpec.cpuModel && existingPC.cpu) {
    if (existingPC.cpu.model !== newSpec.cpuModel) {
      changes.push({
        pcId: existingPC.id,
        componentType: 'cpu',
        componentId: existingPC.cpu.id,
        changeType: 'modified',
        oldValue: JSON.stringify(existingPC.cpu),
        newValue: JSON.stringify({ model: newSpec.cpuModel, cores: newSpec.cpuCores, clock: newSpec.cpuClock }),
        message: `CPU changed from "${existingPC.cpu.model}" to "${newSpec.cpuModel}"`,
        severity: 'warning',
      })
    }
    await prisma.cPU.update({
      where: { id: existingPC.cpu.id },
      data: {
        model: newSpec.cpuModel,
        cores: newSpec.cpuCores || existingPC.cpu.cores,
        clock: newSpec.cpuClock || existingPC.cpu.clock,
      },
    })
  } else if (newSpec.cpuModel && !existingPC.cpu) {
    await prisma.cPU.create({
      data: {
        pcId: existingPC.id,
        model: newSpec.cpuModel,
        cores: newSpec.cpuCores || 0,
        clock: newSpec.cpuClock || null,
      },
    })
    changes.push({
      pcId: existingPC.id,
      componentType: 'cpu',
      changeType: 'added',
      newValue: JSON.stringify({ model: newSpec.cpuModel, cores: newSpec.cpuCores, clock: newSpec.cpuClock }),
      message: `CPU added: "${newSpec.cpuModel}"`,
      severity: 'info',
    })
  }

  // Cek perubahan GPU
  if (newSpec.gpu) {
    if (existingPC.gpu) {
      if (existingPC.gpu.model !== newSpec.gpu) {
        changes.push({
          pcId: existingPC.id,
          componentType: 'gpu',
          componentId: existingPC.gpu.id,
          changeType: 'modified',
          oldValue: JSON.stringify(existingPC.gpu),
          newValue: JSON.stringify({ model: newSpec.gpu }),
          message: `GPU changed from "${existingPC.gpu.model}" to "${newSpec.gpu}"`,
          severity: 'warning',
        })
      }
      await prisma.gPU.update({
        where: { id: existingPC.gpu.id },
        data: { model: newSpec.gpu },
      })
    } else {
      await prisma.gPU.create({
        data: {
          pcId: existingPC.id,
          model: newSpec.gpu,
        },
      })
      changes.push({
        pcId: existingPC.id,
        componentType: 'gpu',
        changeType: 'added',
        newValue: JSON.stringify({ model: newSpec.gpu }),
        message: `GPU added: "${newSpec.gpu}"`,
        severity: 'info',
      })
    }
  }

  // Cek perubahan Motherboard
  if (newSpec.motherboard) {
    // Pastikan motherboardSerial ditangani
    const newMoboSerial = newSpec.motherboardSerial || null;

    if (existingPC.motherboard) {
      if (existingPC.motherboard.model !== newSpec.motherboard) {
        changes.push({
          pcId: existingPC.id,
          componentType: 'motherboard',
          componentId: existingPC.motherboard.id,
          changeType: 'modified',
          oldValue: JSON.stringify(existingPC.motherboard),
          newValue: JSON.stringify({ model: newSpec.motherboard, serialNumber: newMoboSerial }),
          message: `Motherboard changed from "${existingPC.motherboard.model}" to "${newSpec.motherboard}"`,
          severity: 'warning',
        })
      }
      await prisma.motherboard.update({
        where: { id: existingPC.motherboard.id },
        data: {
          model: newSpec.motherboard,
          serialNumber: newMoboSerial
        }
      })
    } else {
      await prisma.motherboard.create({
        data: {
          pcId: existingPC.id,
          model: newSpec.motherboard,
          serialNumber: newMoboSerial
        }
      })
      changes.push({
        pcId: existingPC.id,
        componentType: 'motherboard',
        changeType: 'added',
        newValue: JSON.stringify({ model: newSpec.motherboard, serialNumber: newMoboSerial }),
        message: `Motherboard added: "${newSpec.motherboard}"`,
        severity: 'info',
      })
    }
  }

  // Cek perubahan RAM
  if (newSpec.ramDetails && newSpec.ramDetails.length > 0) {
    const existingRams = existingPC.rams || []
    const newRams = newSpec.ramDetails

    // Hapus RAM yang tidak ada lagi
    for (const existingRam of existingRams) {
      const stillExists = newRams.some((newRam: any) =>
        newRam.model === existingRam.model &&
        newRam.capacity === existingRam.capacity
      )
      if (!stillExists) {
        changes.push({
          pcId: existingPC.id,
          componentType: 'ram',
          componentId: existingRam.id,
          changeType: 'removed',
          oldValue: JSON.stringify(existingRam),
          message: `RAM removed: ${existingRam.manufacturer || ''} ${existingRam.model || ''} ${existingRam.capacity || ''}`,
          severity: 'warning',
        })
        await prisma.rAM.delete({ where: { id: existingRam.id } })
      }
    }

    // Update atau tambah RAM baru
    for (let i = 0; i < newRams.length; i++) {
      const newRam = newRams[i]
      const existingRam = existingRams[i]

      if (existingRam) {
        // Cek perubahan
        if (
          existingRam.manufacturer !== newRam.manufacturer ||
          existingRam.model !== newRam.model ||
          existingRam.capacity !== newRam.capacity ||
          existingRam.type !== newRam.type
        ) {
          changes.push({
            pcId: existingPC.id,
            componentType: 'ram',
            componentId: existingRam.id,
            changeType: 'modified',
            oldValue: JSON.stringify(existingRam),
            newValue: JSON.stringify(newRam),
            message: `RAM slot ${i} changed`,
            severity: 'warning',
          })
        }
        await prisma.rAM.update({
          where: { id: existingRam.id },
          data: {
            manufacturer: newRam.manufacturer || null,
            model: newRam.model || null,
            capacity: newRam.capacity || null,
            speed: newRam.speed || null,
            type: newRam.type || null,
            formFactor: newRam.formFactor || null,
            serialNumber: newRam.serialNumber || null,
            bankLabel: newRam.bank || null,
          },
        })
      } else {
        // RAM baru
        await prisma.rAM.create({
          data: {
            pcId: existingPC.id,
            manufacturer: newRam.manufacturer || null,
            model: newRam.model || null,
            capacity: newRam.capacity || null,
            speed: newRam.speed || null,
            type: newRam.type || null,
            formFactor: newRam.formFactor || null,
            serialNumber: newRam.serialNumber || null,
            bankLabel: newRam.bank || null,
            slotIndex: i,
          },
        })
        changes.push({
          pcId: existingPC.id,
          componentType: 'ram',
          changeType: 'added',
          newValue: JSON.stringify(newRam),
          message: `RAM added to slot ${i}: ${newRam.manufacturer || ''} ${newRam.model || ''} ${newRam.capacity || ''}`,
          severity: 'info',
        })
      }
    }
  }

  // Cek perubahan Storage
  if (newSpec.storageDetails && newSpec.storageDetails.length > 0) {
    const existingStorages = existingPC.storages || []
    const newStorages = newSpec.storageDetails

    // Hapus storage yang tidak ada lagi
    for (const existingStorage of existingStorages) {
      const stillExists = newStorages.some((newStorage: any) =>
        newStorage.model === existingStorage.model &&
        newStorage.size === existingStorage.size
      )
      if (!stillExists) {
        changes.push({
          pcId: existingPC.id,
          componentType: 'storage',
          componentId: existingStorage.id,
          changeType: 'removed',
          oldValue: JSON.stringify(existingStorage),
          message: `Storage removed: ${existingStorage.manufacturer || ''} ${existingStorage.model || ''} ${existingStorage.size || ''}`,
          severity: 'warning',
        })
        await prisma.storage.delete({ where: { id: existingStorage.id } })
      }
    }

    // Update atau tambah storage baru
    for (let i = 0; i < newStorages.length; i++) {
      const newStorage = newStorages[i]
      const existingStorage = existingStorages[i]

      if (existingStorage) {
        // Cek perubahan
        if (
          existingStorage.manufacturer !== newStorage.manufacturer ||
          existingStorage.model !== newStorage.model ||
          existingStorage.size !== newStorage.size ||
          existingStorage.type !== newStorage.type
        ) {
          changes.push({
            pcId: existingPC.id,
            componentType: 'storage',
            componentId: existingStorage.id,
            changeType: 'modified',
            oldValue: JSON.stringify(existingStorage),
            newValue: JSON.stringify(newStorage),
            message: `Storage ${i} changed`,
            severity: 'warning',
          })
        }
        await prisma.storage.update({
          where: { id: existingStorage.id },
          data: {
            manufacturer: newStorage.manufacturer || null,
            model: newStorage.model || null,
            size: newStorage.size || null,
            interface: newStorage.interface || null,
            type: newStorage.type || null,
            serialNumber: newStorage.serialNumber || null,
          },
        })
      } else {
        // Storage baru
        await prisma.storage.create({
          data: {
            pcId: existingPC.id,
            manufacturer: newStorage.manufacturer || null,
            model: newStorage.model || null,
            size: newStorage.size || null,
            interface: newStorage.interface || null,
            type: newStorage.type || null,
            serialNumber: newStorage.serialNumber || null,
            diskIndex: i,
          },
        })
        changes.push({
          pcId: existingPC.id,
          componentType: 'storage',
          changeType: 'added',
          newValue: JSON.stringify(newStorage),
          message: `Storage added: ${newStorage.manufacturer || ''} ${newStorage.model || ''} ${newStorage.size || ''}`,
          severity: 'info',
        })
      }
    }
  }
  // Check changes for network interfaces (simple update for now)
  if (newSpec.interfaces && newSpec.interfaces.length > 0) {
    // Just delete all old and recreate new for simplicity in this version, OR smarter update.
    // Doing smarter update to save history/ID if possible, but network interfaces can be dynamic.
    // For now, let's just update `isUp` and IPs if matched by name, or recreate if not executing.

    // Since prisma doesn't support easy bulk upsert with different criteria, we usually do delete/create or manual finding.
    // But preserving IDs is good. Let's do a simple loop.

    const existingNets = existingPC.networks || [];
    const newNets = newSpec.interfaces;

    for (const net of newNets) {
      const match = existingNets.find((n: any) => n.name === net.name);
      if (match) {
        await prisma.networkInterface.update({
          where: { id: match.id },
          data: {
            macAddr: net.macAddr || null,
            ipv4: net.ipv4 || null,
            isUp: net.isUp !== undefined ? net.isUp : true,
            bandwidth: net.bandwidth || null
          }
        })
      } else {
        await prisma.networkInterface.create({
          data: {
            pcId: existingPC.id,
            name: net.name || 'Unknown',
            macAddr: net.macAddr || null,
            ipv4: net.ipv4 || null,
            isUp: net.isUp !== undefined ? net.isUp : true,
            bandwidth: net.bandwidth || null
          }
        })
      }
    }
  }

  // Simpan semua perubahan
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
