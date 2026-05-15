-- CreateEnum
CREATE TYPE "OrderHistoryAction" AS ENUM ('created', 'approved', 'preparing', 'invoiced', 'ready', 'dispatched', 'delivered', 'undelivered', 'cancelled');

-- CreateTable
CREATE TABLE "order_history_entries" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "action" "OrderHistoryAction" NOT NULL,
    "actor_type" VARCHAR(20) NOT NULL,
    "actor_name" VARCHAR(255) NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_history_entries_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "order_history_entries" ADD CONSTRAINT "order_history_entries_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
