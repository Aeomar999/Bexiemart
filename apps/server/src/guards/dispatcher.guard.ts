import { UserRole } from "@prisma/client";
import { createRoleGuard } from "./create-role-guard";

// No checkActive: DispatcherProfile has no isActive column, so the check would
// read `undefined` and reject every dispatcher. Having a profile is the gate.
export const DispatcherGuard = createRoleGuard(UserRole.DISPATCHER, {
  model: "dispatcherProfile",
  findByField: "userId",
});
