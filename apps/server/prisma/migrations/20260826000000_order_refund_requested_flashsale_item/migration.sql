-- Add refund request status to the order lifecycle
ALTER TYPE "OrderStatus" ADD VALUE 'refund_requested';

-- Trace flash-sale participation per line item so cancellations can roll
-- back soldCount (flash-sale quota accounting).
ALTER TABLE "OrderItem" ADD COLUMN "flashSaleItemId" TEXT;
