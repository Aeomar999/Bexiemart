-- Enforce one escrow per (orderId, vendorId) so a webhook + verify() race can
-- never double-hold (and later double-pay) a vendor for the same order.

-- Dedupe any escrows the non-atomic guard already let through. Keep the
-- earliest row per (orderId, vendorId); delete the rest. NULL vendorId rows
-- (platform-owned items) are exempt — they are never escrowed here and NULLs
-- are treated as distinct by the unique index anyway.
DELETE FROM "Escrow"
WHERE "id" IN (
  SELECT "id" FROM (
    SELECT
      "id",
      ROW_NUMBER() OVER (
        PARTITION BY "orderId", "vendorId"
        ORDER BY "createdAt" ASC, "id" ASC
      ) AS rn
    FROM "Escrow"
    WHERE "vendorId" IS NOT NULL
  ) ranked
  WHERE ranked.rn > 1
);

-- CreateIndex
CREATE UNIQUE INDEX "Escrow_orderId_vendorId_key" ON "Escrow"("orderId", "vendorId");
