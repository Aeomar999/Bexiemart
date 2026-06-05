import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthGuard } from "../guards/auth.guard";
import { PrismaService } from "../prisma/prisma.service";
import { PrismaModule } from "../prisma/prisma.module";
import { createAuth } from "./better-auth";
import { AUTH } from "./auth.constants";

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [
    AuthGuard,
    {
      provide: AUTH,
      useFactory: (prisma: PrismaService) => createAuth(prisma),
      inject: [PrismaService],
    },
  ],
  exports: [AuthGuard, AUTH],
})
export class AuthModule {}
