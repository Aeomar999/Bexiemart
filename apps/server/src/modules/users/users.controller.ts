import { Controller, Get, Patch, Body, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBody } from "@nestjs/swagger";
import { AuthGuard } from "../../guards/auth.guard";
import { UsersService } from "./users.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@Controller("users")
@UseGuards(AuthGuard)
@ApiTags("Users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: "Get current user profile" })
  @Get("me")
  getCurrentUser(@Req() req: any) {
    return this.usersService.getMe(req.user.id);
  }

  @ApiOperation({ summary: "Update user profile" })
  @ApiBody({ type: UpdateProfileDto })
  @Patch("profile")
  updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }
}
