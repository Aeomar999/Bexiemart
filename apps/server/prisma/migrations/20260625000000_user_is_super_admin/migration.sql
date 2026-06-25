-- Super-admin privilege flag. A super admin is an ADMIN that can also manage the
-- admin team (create new admins). Defaults false so all existing users are
-- unaffected; the bootstrap admin is promoted via the seed script.

-- AlterTable
ALTER TABLE "User" ADD COLUMN "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false;
