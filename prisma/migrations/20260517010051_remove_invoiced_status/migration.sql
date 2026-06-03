/*
  Warnings:

  - The values [invoiced] on the enum `OrderHistoryAction` will be removed. If these variants are still used in the database, this will fail.
  - The values [invoiced] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrderHistoryAction_new" AS ENUM ('created', 'approved', 'preparing', 'ready', 'available_for_pickup', 'dispatched', 'delivered', 'undelivered', 'cancelled');
ALTER TABLE "order_history_entries" ALTER COLUMN "action" TYPE "OrderHistoryAction_new" USING ("action"::text::"OrderHistoryAction_new");
ALTER TYPE "OrderHistoryAction" RENAME TO "OrderHistoryAction_old";
ALTER TYPE "OrderHistoryAction_new" RENAME TO "OrderHistoryAction";
DROP TYPE "public"."OrderHistoryAction_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('pending', 'approved', 'preparing', 'ready', 'available_for_pickup', 'dispatched', 'delivered', 'undelivered', 'cancelled');
ALTER TABLE "public"."orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "public"."OrderStatus_old";
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending';
COMMIT;
