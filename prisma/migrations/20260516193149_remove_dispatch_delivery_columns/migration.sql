/*
  Warnings:

  - You are about to drop the column `delivered_at` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `dispatched_at` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `received_by` on the `orders` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "orders" DROP COLUMN "delivered_at",
DROP COLUMN "dispatched_at",
DROP COLUMN "received_by";
