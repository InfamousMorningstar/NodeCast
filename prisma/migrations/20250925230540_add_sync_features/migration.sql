-- CreateTable
CREATE TABLE "public"."sync_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checksum" TEXT,
    "metadata" JSONB,
    "conflictResolution" TEXT,
    "clientId" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "sync_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sync_connections" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "subscriptions" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "sync_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sync_events_userId_timestamp_idx" ON "public"."sync_events"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "sync_events_filePath_timestamp_idx" ON "public"."sync_events"("filePath", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "sync_connections_clientId_key" ON "public"."sync_connections"("clientId");

-- CreateIndex
CREATE INDEX "sync_connections_userId_active_idx" ON "public"."sync_connections"("userId", "active");

-- AddForeignKey
ALTER TABLE "public"."sync_events" ADD CONSTRAINT "sync_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sync_connections" ADD CONSTRAINT "sync_connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
