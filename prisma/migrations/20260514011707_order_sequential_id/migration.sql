-- Drop existing tables (development data only)
DROP TABLE IF EXISTS "order_items" CASCADE;
DROP TABLE IF EXISTS "orders" CASCADE;

-- Recreate orders with sequential integer id
CREATE TABLE "orders" (
  "id"               SERIAL PRIMARY KEY,
  "olist_id"         INTEGER UNIQUE,
  "olist_numero"     VARCHAR(50),
  "status"           "OrderStatus" NOT NULL DEFAULT 'pending',
  "payment"          "PaymentMethod" NOT NULL,
  "freight"          DECIMAL(10,2) NOT NULL,
  "notes"            TEXT,
  "buyer_name"       VARCHAR(255) NOT NULL,
  "buyer_phone"      VARCHAR(50) NOT NULL,
  "recipient_name"   VARCHAR(255) NOT NULL,
  "recipient_phone"  VARCHAR(50) NOT NULL,
  "card_message"     TEXT,
  "zip_code"         VARCHAR(10) NOT NULL,
  "street"           VARCHAR(255) NOT NULL,
  "street_number"    VARCHAR(20) NOT NULL,
  "complement"       VARCHAR(100),
  "neighborhood"     VARCHAR(100) NOT NULL,
  "delivery_date"    DATE NOT NULL,
  "delivery_period"  VARCHAR(50) NOT NULL,
  "courier_name"     VARCHAR(100),
  "dispatched_at"    TIMESTAMPTZ,
  "delivered_at"     TIMESTAMPTZ,
  "received_by"      VARCHAR(100),
  "mp_preference_id" VARCHAR(100),
  "source"           VARCHAR(20) NOT NULL DEFAULT 'admin',
  "created_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Start sequence at 9000 to avoid collision with existing Olist order numbers
ALTER SEQUENCE "orders_id_seq" RESTART WITH 9000;

-- Recreate order_items with integer foreign key
CREATE TABLE "order_items" (
  "id"       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" INTEGER NOT NULL REFERENCES "orders"("id"),
  "sku"      VARCHAR(100),
  "name"     VARCHAR(255) NOT NULL,
  "price"    DECIMAL(10,2) NOT NULL,
  "quantity" INTEGER NOT NULL
);
