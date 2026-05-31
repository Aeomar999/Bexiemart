import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  InternalServerErrorException,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { Throttle } from "@nestjs/throttler";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "../guards/auth.guard";
import { auth } from "./better-auth";
import { PrismaService } from "../prisma/prisma.service";
import { UserRole } from "@prisma/client";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

@ApiTags("Auth")
@ApiBearerAuth()
@Controller("auth")
export class AuthController {
  constructor(private readonly prisma: PrismaService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: "Register a new user" })
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() body: RegisterDto
  ) {
    const { email, password, name, role } = body;

    const res = await auth.api.signUpEmail({
      body: { email, password, name },
      headers: {} as Headers,
      asResponse: true,
    });

    const cookie = res.headers.get("set-cookie");
    const tokenMatch = cookie?.match(/better-auth\.session_token=([^;]+)/);
    const signedToken = tokenMatch ? tokenMatch[1] : null;

    if (!signedToken) {
      throw new UnauthorizedException("Registration failed");
    }

    const data = await res.json();
    let user = data.user;

    if (role === "vendor") {
      try {
        const updatedUser = await this.prisma.user.update({
          where: { id: user.id },
          data: { role: UserRole.VENDOR },
        });
        
        user = updatedUser;

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36);

        await this.prisma.vendorProfile.create({
          data: {
            userId: user.id,
            shopName: name + "'s Shop",
            slug,
          },
        });
      } catch (e) {
        console.error("Failed to create vendor profile:", e);
        throw new InternalServerErrorException("Failed to complete vendor setup");
      }
    }

    return {
      user: user,
      token: signedToken,
    };
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: "Login with email and password" })
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginDto
  ) {
    const { email, password } = body;

    const res = await auth.api.signInEmail({
      body: { email, password },
      headers: {} as Headers,
      asResponse: true,
    });

    const cookie = res.headers.get("set-cookie");
    const tokenMatch = cookie?.match(/better-auth\.session_token=([^;]+)/);
    const signedToken = tokenMatch ? tokenMatch[1] : null;

    if (!signedToken) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Since we used asResponse, we need to parse the JSON body to get the user
    const data = await res.json();

    // Fetch the full user from Prisma to ensure we get custom fields like 'role'
    const fullUser = await this.prisma.user.findUnique({
      where: { id: data.user.id }
    });

    return {
      user: fullUser || data.user,
      token: signedToken,
    };
  }

  @ApiOperation({ summary: "Get current user" })
  @Get("me")
  @UseGuards(AuthGuard)
  async getCurrentUser(@Req() req: any) {
    if (!req.user) {
      throw new UnauthorizedException("User not found");
    }

    const fullUser = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      include: { vendorProfile: true }
    });

    return { user: fullUser || req.user };
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: "Request password reset" })
  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    try {
      await (auth.api as any).forgetPassword({
        body: { email: body.email, redirectTo: "/reset-password" },
      });
    } catch (e) {
      console.error("Forget password error:", e);
    }
    return { message: "If an account exists, a reset link has been sent." };
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: "Reset password with token" })
  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() body: ResetPasswordDto
  ) {
    await auth.api.resetPassword({
      body: { newPassword: body.newPassword },
    });
    return { message: "Password reset successfully." };
  }
}
