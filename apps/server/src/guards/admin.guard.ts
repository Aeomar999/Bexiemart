import { UserRole } from "@prisma/client";
import { createRoleGuard } from "./create-role-guard";

export const AdminGuard = createRoleGuard(UserRole.ADMIN);
