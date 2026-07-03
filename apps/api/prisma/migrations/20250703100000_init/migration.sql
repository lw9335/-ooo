-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'DISPATCHER');

-- CreateEnum
CREATE TYPE "WorkerStatus" AS ENUM ('IDLE', 'WORKING');

-- CreateEnum
CREATE TYPE "BrandType" AS ENUM ('TRUCK', 'NEW_ENERGY', 'BATTERY');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('DISPATCH', 'SYSTEM');

-- CreateTable
CREATE TABLE "admin_user" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'DISPATCHER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "weworkUserId" TEXT,
    "avatar" TEXT,
    "intro" TEXT,
    "status" "WorkerStatus" NOT NULL DEFAULT 'IDLE',
    "workingSince" TIMESTAMP(3),
    "locationText" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "profileFilled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "worker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" INTEGER,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_skill" (
    "id" SERIAL NOT NULL,
    "workerId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 3,

    CONSTRAINT "worker_skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "BrandType" NOT NULL DEFAULT 'TRUCK',
    "sort" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_brand" (
    "id" SERIAL NOT NULL,
    "workerId" INTEGER NOT NULL,
    "brandId" INTEGER NOT NULL,

    CONSTRAINT "worker_brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispatch_order" (
    "id" SERIAL NOT NULL,
    "orderNo" TEXT NOT NULL,
    "brandName" TEXT,
    "categoryId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "assignedWorkerId" INTEGER,
    "createdById" INTEGER,
    "assignedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dispatch_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" SERIAL NOT NULL,
    "workerId" INTEGER NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'SYSTEM',
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "orderId" INTEGER,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "pushed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stat_event" (
    "id" SERIAL NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorId" INTEGER,
    "event" TEXT NOT NULL,
    "targetId" INTEGER,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stat_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_user_username_key" ON "admin_user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "worker_weworkUserId_key" ON "worker"("weworkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "worker_skill_workerId_categoryId_key" ON "worker_skill"("workerId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "brand_name_key" ON "brand"("name");

-- CreateIndex
CREATE UNIQUE INDEX "worker_brand_workerId_brandId_key" ON "worker_brand"("workerId", "brandId");

-- CreateIndex
CREATE UNIQUE INDEX "dispatch_order_orderNo_key" ON "dispatch_order"("orderNo");

-- CreateIndex
CREATE INDEX "stat_event_event_idx" ON "stat_event"("event");

-- CreateIndex
CREATE INDEX "stat_event_actorType_actorId_idx" ON "stat_event"("actorType", "actorId");

-- AddForeignKey
ALTER TABLE "skill_category" ADD CONSTRAINT "skill_category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "skill_category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_skill" ADD CONSTRAINT "worker_skill_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_skill" ADD CONSTRAINT "worker_skill_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "skill_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_brand" ADD CONSTRAINT "worker_brand_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_brand" ADD CONSTRAINT "worker_brand_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch_order" ADD CONSTRAINT "dispatch_order_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "skill_category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch_order" ADD CONSTRAINT "dispatch_order_assignedWorkerId_fkey" FOREIGN KEY ("assignedWorkerId") REFERENCES "worker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatch_order" ADD CONSTRAINT "dispatch_order_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "admin_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
