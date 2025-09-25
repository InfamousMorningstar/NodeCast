-- CreateTable
CREATE TABLE "public"."zfs_snapshots" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dataset" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "size" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "zfs_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."file_versions" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "snapshotName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checksum" TEXT,
    "size" BIGINT,
    "metadata" JSONB,

    CONSTRAINT "file_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."snapshot_policies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dataset" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "retention" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "prefix" TEXT NOT NULL DEFAULT 'nodecast',
    "skipEmpty" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "snapshot_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."zfs_datasets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mountpoint" TEXT,
    "quota" BIGINT,
    "used" BIGINT NOT NULL DEFAULT 0,
    "available" BIGINT NOT NULL DEFAULT 0,
    "compression" TEXT NOT NULL DEFAULT 'lz4',
    "recordsize" INTEGER NOT NULL DEFAULT 1048576,
    "encryption" TEXT NOT NULL DEFAULT 'off',
    "dedup" TEXT NOT NULL DEFAULT 'off',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT,
    "ownerType" TEXT,

    CONSTRAINT "zfs_datasets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."performance_metrics" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataset" TEXT,
    "readIOPS" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "writeIOPS" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "readThroughput" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "writeThroughput" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "l2arcHitRatio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "arcHitRatio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgReadLatency" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgWriteLatency" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgSyncLatency" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "queueDepth" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "performance_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."security_audits" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "dataset" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "risk" TEXT NOT NULL DEFAULT 'low',

    CONSTRAINT "security_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "zfs_snapshots_name_key" ON "public"."zfs_snapshots"("name");

-- CreateIndex
CREATE UNIQUE INDEX "snapshot_policies_name_key" ON "public"."snapshot_policies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "zfs_datasets_name_key" ON "public"."zfs_datasets"("name");

-- AddForeignKey
ALTER TABLE "public"."zfs_snapshots" ADD CONSTRAINT "zfs_snapshots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."file_versions" ADD CONSTRAINT "file_versions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."security_audits" ADD CONSTRAINT "security_audits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
