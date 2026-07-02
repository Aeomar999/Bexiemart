import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { BannerPlacement } from "@prisma/client";
import { AuthGuard } from "../../guards/auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { BannersService } from "./banners.service";
import { CreateBannerDto } from "./dto/create-banner.dto";
import { UpdateBannerDto } from "./dto/update-banner.dto";

@ApiTags("Admin Banners")
@ApiBearerAuth()
@Controller("admin/banners")
@UseGuards(AuthGuard, AdminGuard)
@Throttle({ default: { limit: 30, ttl: 60000 } })
export class AdminBannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Get()
  @ApiOperation({ summary: "List all banners (admin)" })
  @ApiQuery({ name: "placement", enum: BannerPlacement, required: false })
  list(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("placement") placement?: BannerPlacement
  ) {
    return this.bannersService.list(Number(page) || 1, Number(limit) || 20, placement);
  }

  @Post()
  @ApiOperation({ summary: "Create a banner" })
  create(@Body() dto: CreateBannerDto) {
    return this.bannersService.create(dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a banner" })
  update(@Param("id") id: string, @Body() dto: UpdateBannerDto) {
    return this.bannersService.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a banner" })
  remove(@Param("id") id: string) {
    return this.bannersService.remove(id);
  }
}
