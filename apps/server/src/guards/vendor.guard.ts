import { UserRole } from "@prisma/client";
import { createRoleGuard } from "./create-role-guard";

export const VendorGuard = createRoleGuard(UserRole.VENDOR, {
  model: "vendorProfile",
  findByField: "userId",
  checkActive: true,
});
