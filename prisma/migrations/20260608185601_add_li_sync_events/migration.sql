-- CreateTable
CREATE TABLE "li_sync_events" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "payload" JSONB NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ,

    CONSTRAINT "li_sync_events_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "li_sync_events" ADD CONSTRAINT "li_sync_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
