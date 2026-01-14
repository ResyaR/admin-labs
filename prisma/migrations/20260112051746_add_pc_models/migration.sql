-- CreateTable
CREATE TABLE "pcs" (
    "id" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "brand" TEXT,
    "os" TEXT,
    "osVersion" TEXT,
    "osBuild" TEXT,
    "arch" TEXT,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pcs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cpus" (
    "id" TEXT NOT NULL,
    "pcId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "cores" INTEGER NOT NULL,
    "clock" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cpus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gpus" (
    "id" TEXT NOT NULL,
    "pcId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gpus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "motherboards" (
    "id" TEXT NOT NULL,
    "pcId" TEXT NOT NULL,
    "manufacturer" TEXT,
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "motherboards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rams" (
    "id" TEXT NOT NULL,
    "pcId" TEXT NOT NULL,
    "manufacturer" TEXT,
    "model" TEXT,
    "capacity" TEXT,
    "speed" TEXT,
    "type" TEXT,
    "formFactor" TEXT,
    "slotIndex" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storages" (
    "id" TEXT NOT NULL,
    "pcId" TEXT NOT NULL,
    "manufacturer" TEXT,
    "model" TEXT,
    "size" TEXT,
    "interface" TEXT,
    "type" TEXT,
    "diskIndex" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "network_interfaces" (
    "id" TEXT NOT NULL,
    "pcId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "macAddr" TEXT,
    "ipv4" TEXT,
    "isUp" BOOLEAN NOT NULL DEFAULT true,
    "bandwidth" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "network_interfaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "component_changes" (
    "id" TEXT NOT NULL,
    "pcId" TEXT NOT NULL,
    "componentType" TEXT NOT NULL,
    "componentId" TEXT,
    "changeType" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'warning',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "component_changes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pcs_hostname_key" ON "pcs"("hostname");

-- CreateIndex
CREATE UNIQUE INDEX "cpus_pcId_key" ON "cpus"("pcId");

-- CreateIndex
CREATE UNIQUE INDEX "gpus_pcId_key" ON "gpus"("pcId");

-- CreateIndex
CREATE UNIQUE INDEX "motherboards_pcId_key" ON "motherboards"("pcId");

-- CreateIndex
CREATE INDEX "rams_pcId_idx" ON "rams"("pcId");

-- CreateIndex
CREATE INDEX "storages_pcId_idx" ON "storages"("pcId");

-- CreateIndex
CREATE INDEX "network_interfaces_pcId_idx" ON "network_interfaces"("pcId");

-- CreateIndex
CREATE INDEX "component_changes_pcId_idx" ON "component_changes"("pcId");

-- CreateIndex
CREATE INDEX "component_changes_createdAt_idx" ON "component_changes"("createdAt");

-- AddForeignKey
ALTER TABLE "cpus" ADD CONSTRAINT "cpus_pcId_fkey" FOREIGN KEY ("pcId") REFERENCES "pcs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gpus" ADD CONSTRAINT "gpus_pcId_fkey" FOREIGN KEY ("pcId") REFERENCES "pcs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "motherboards" ADD CONSTRAINT "motherboards_pcId_fkey" FOREIGN KEY ("pcId") REFERENCES "pcs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rams" ADD CONSTRAINT "rams_pcId_fkey" FOREIGN KEY ("pcId") REFERENCES "pcs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storages" ADD CONSTRAINT "storages_pcId_fkey" FOREIGN KEY ("pcId") REFERENCES "pcs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "network_interfaces" ADD CONSTRAINT "network_interfaces_pcId_fkey" FOREIGN KEY ("pcId") REFERENCES "pcs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_changes" ADD CONSTRAINT "component_changes_pcId_fkey" FOREIGN KEY ("pcId") REFERENCES "pcs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
