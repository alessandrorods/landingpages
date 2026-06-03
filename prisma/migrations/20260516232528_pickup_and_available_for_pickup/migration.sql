-- AlterEnum
ALTER TYPE "OrderHistoryAction" ADD VALUE 'available_for_pickup';

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'available_for_pickup';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "pickup" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "freight" SET DEFAULT 0,
ALTER COLUMN "zip_code" DROP NOT NULL,
ALTER COLUMN "street" DROP NOT NULL,
ALTER COLUMN "street_number" DROP NOT NULL,
ALTER COLUMN "neighborhood" DROP NOT NULL,
ALTER COLUMN "delivery_period" DROP NOT NULL;
