-- AlterTable
ALTER TABLE "external_dispatch_orders" ADD COLUMN "courier_id" UUID,
ADD COLUMN "dispatched_at" TIMESTAMPTZ;
