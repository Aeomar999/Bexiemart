-- AlterTable
ALTER TABLE "VendorProfile" ADD COLUMN "taxId" TEXT,
ADD COLUMN "taxStatus" TEXT NOT NULL DEFAULT 'NONE';
