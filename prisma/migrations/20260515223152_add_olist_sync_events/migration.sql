-- CreateEnum
CREATE TYPE "OlistSyncEventType" AS ENUM ('order_created', 'status_updated');

-- CreateEnum
CREATE TYPE "OlistSyncEventStatus" AS ENUM ('pending', 'done', 'failed');

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_order_id_fkey";

-- AlterTable
ALTER TABLE "order_items" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "olist_sync_events" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "type" "OlistSyncEventType" NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "OlistSyncEventStatus" NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ,

    CONSTRAINT "olist_sync_events_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "olist_sync_events" ADD CONSTRAINT "olist_sync_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
