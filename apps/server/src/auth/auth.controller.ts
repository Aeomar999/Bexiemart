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
  All,
  Res,
  Inject,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { toNodeHandler } from "better-auth/node";
import { Throttle } from "@nestjs/throttler";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "../guards/auth.guard";
import { AUTH } from "./auth.constants";
import { PrismaService } from "../prisma/prisma.service";
import { UserRole } from "@prisma/client";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { ResendVerificationDto } from "./dto/resend-verification.dto";
import { CheckAvailabilityDto } from "./dto/check-availability.dto";
import { VerifyEmailOtpDto } from "./dto/verify-email-otp.dto";

@ApiTags("Auth")
@ApiBearerAuth()
@Controller("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(AUTH) private readonly auth: any
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: "Register a new user" })
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: RegisterDto) {
    const { email, password, name, role, phone } = body;

    this.logger.log(
      `Registering user: ${email}, role: ${role || "customer"}, phone: ${phone || "none"}`
    );

    const res = await this.auth.api.signUpEmail({
      body: { email, password, name, callbackURL: "bexiemart://verify-email" },
      headers: new Headers({ origin: "bexiemart://" }),
      asResponse: true,
    });

    const data = await res.json();
    this.logger.debug(
      `Better-auth signUpEmail response status: ${res.status}, data keys: ${Object.keys(data).join(", ")}`
    );

    if (!res.ok) {
      this.logger.error(`Registration failed for ${email}: ${data.message || "Unknown error"}`);
      throw new UnauthorizedException(data.message || "Registration failed");
    }

    if (!data.user || !data.user.id) {
      this.logger.error(`Better-auth returned no user for ${email}: ${JSON.stringify(data)}`);
      throw new InternalServerErrorException("User creation failed");
    }

    const cookie = res.headers.get("set-cookie");
    const tokenMatch = cookie?.match(/better-auth\.session_token=([^;]+)/);
    const signedToken = (tokenMatch ? decodeURIComponent(tokenMatch[1]) : null) || data.token;

    this.logger.log(`Better-auth user response: id=${data.user.id}, email=${data.user.email}`);

    const dbUser = await this.prisma.user.findUnique({ where: { email } });
    let user = dbUser ?? (data.user as { id: string; email: string });
    if (dbUser) {
      this.logger.log(`Fetched real DB user: id=${user.id}, email=${user.email}`);
    } else {
      this.logger.warn(`User created by better-auth not found by email, using response data.id`);
    }

    if (phone) {
      this.logger.log(`Updating phone number for user ${user.id}`);
      try {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { phoneNumber: phone },
        });
        this.logger.log(`Phone number updated for user ${user.id}`);
      } catch (e) {
        this.logger.error(
          `Failed to update phone for user ${user.id}: ${e instanceof Error ? e.message : e}`
        );
        throw e;
      }
    }

    if (role === "vendor") {
      this.logger.log(`Setting up vendor profile for user ${user.id}`);
      try {
        const updatedUser = await this.prisma.user.update({
          where: { id: user.id },
          data: { role: UserRole.VENDOR },
        });

        user = updatedUser;
        this.logger.log(`User ${user.id} role updated to VENDOR`);

        const slug =
          name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") +
          "-" +
          Date.now().toString(36);

        await this.prisma.vendorProfile.create({
          data: {
            userId: user.id,
            shopName: name + "'s Shop",
            slug,
          },
        });
        this.logger.log(`Vendor profile created for user ${user.id} with slug: ${slug}`);
      } catch (e) {
        this.logger.error(
          `Failed to create vendor profile for user ${user.id}: ${e instanceof Error ? e.message : e}`
        );
        throw new InternalServerErrorException("Failed to complete vendor setup");
      }
    }

    return {
      user: user,
      token: signedToken || null,
      message: signedToken
        ? "Registration successful"
        : "Please verify your email address before logging in.",
    };
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: "Login with email and password" })
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto) {
    const { email, password } = body;
    this.logger.log(`Login attempt: ${email}`);

    const res = await this.auth.api.signInEmail({
      body: { email, password },
      headers: new Headers({ origin: "bexiemart://" }),
      asResponse: true,
    });

    const data = await res.json();

    if (!res.ok) {
      this.logger.warn(`Login failed for ${email}: ${data.message || data.error?.message}`);
      throw new UnauthorizedException(data.message || data.error?.message || "Invalid credentials");
    }

    const rawToken = data.token;

    if (!rawToken) {
      this.logger.error(`Session creation failed for ${email} - no token returned`);
      throw new UnauthorizedException("Session creation failed");
    }

    this.logger.log(`Login successful for ${email}, user id: ${data.user?.id}`);

    const fullUser = await this.prisma.user.findUnique({
      where: { id: data.user.id },
    });
    if (!fullUser) {
      this.logger.warn(
        `User ${data.user.id} from better-auth not found in Prisma (dual client issue)`
      );
    }

    return {
      user: fullUser || data.user,
      token: rawToken,
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
      include: { vendorProfile: true },
    });

    return { user: fullUser || req.user };
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: "Resend verification email" })
  @Post("resend-verification")
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() body: ResendVerificationDto) {
    const { email } = body;
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Do not reveal whether an account exists (prevents user enumeration).
    if (user) {
      this.logger.log(`Resending verification email to: ${email}`);
      try {
        await (this.auth.api as any).sendVerificationEmail({
          body: { email, callbackURL: "bexiemart://verify-email" },
          headers: new Headers({ origin: "bexiemart://" }),
        });
      } catch (e) {
        this.logger.error(`Resend verification error for ${email}: ${e}`);
      }
    }
    return { message: "If an account exists, a verification email has been sent." };
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: "Request password reset" })
  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    try {
      await (this.auth.api as any).forgetPassword({
        body: { email: body.email, redirectTo: "/reset-password" },
        headers: new Headers({ origin: "bexiemart://" }),
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
  async resetPassword(@Body() body: ResetPasswordDto) {
    await this.auth.api.resetPassword({
      body: { newPassword: body.newPassword, token: body.token },
    });
    return { message: "Password reset successfully." };
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: "Check if email or phone is available" })
  @Post("check-availability")
  @HttpCode(HttpStatus.OK)
  async checkAvailability(@Body() body: CheckAvailabilityDto) {
    const { email, phone } = body;
    const errors: Record<string, string> = {};

    if (email) {
      const existingEmail = await this.prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        errors.email = "This email is already registered.";
      }
    }

    if (phone) {
      // Phone is not marked as unique in schema implicitly for all cases, but better-auth might enforce it depending on config. Let's check DB.
      const existingPhone = await this.prisma.user.findFirst({ where: { phoneNumber: phone } });
      if (existingPhone) {
        errors.phone = "This phone number is already registered.";
      }
    }

    const isAvailable = Object.keys(errors).length === 0;
    return { isAvailable, errors };
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: "Verify email using OTP code" })
  @Post("verify-email-otp")
  @HttpCode(HttpStatus.OK)
  async verifyEmailOtp(@Body() body: VerifyEmailOtpDto) {
    const { email, code } = body;
    this.logger.log(`Email OTP verification attempt for: ${email}`);

    // Find the most recent unexpired email-otp verification record
    const verification = await this.prisma.verification.findFirst({
      where: {
        identifier: `email-otp:${email}`,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!verification || verification.value !== code) {
      throw new UnauthorizedException("Invalid or expired verification code.");
    }

    // Mark the user's email as verified
    await this.prisma.user.update({
      where: { email },
      data: { emailVerified: true },
    });

    // Clean up used verification records for this email
    await this.prisma.verification.deleteMany({
      where: { identifier: `email-otp:${email}` },
    });

    this.logger.log(`Email verified via OTP for: ${email}`);
    return { message: "Email verified successfully." };
  }

  @All("/*")
  async handleAuth(@Req() req: Request, @Res() res: Response) {
    const handler = toNodeHandler(this.auth);
    return handler(req, res);
  }
}
