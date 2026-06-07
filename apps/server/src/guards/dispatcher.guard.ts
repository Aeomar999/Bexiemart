import { UserRole } from "@prisma/client";
import { createRoleGuard } from "./create-role-guard";

export const DispatcherGuard = createRoleGuard(UserRole.DISPATCHER, {
  model: "dispatcherProfile",
  findByField: "userId",
  checkActive: true,
});
