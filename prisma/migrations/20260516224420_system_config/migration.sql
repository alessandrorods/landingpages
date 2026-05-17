-- CreateTable
CREATE TABLE "system_config" (
    "key" VARCHAR(100) NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("key")
);
