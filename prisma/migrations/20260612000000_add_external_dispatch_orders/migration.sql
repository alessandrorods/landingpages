-- CreateTable
CREATE TABLE "external_dispatch_orders" (
    "id" SERIAL NOT NULL,
    "platform" VARCHAR(50) NOT NULL,
    "external_number" VARCHAR(50) NOT NULL,
    "zip_code" VARCHAR(10),
    "neighborhood" VARCHAR(100),
    "delivery_date" DATE NOT NULL,
    "delivery_period" VARCHAR(50),
    "scheduled_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "external_dispatch_orders_pkey" PRIMARY KEY ("id")
);
